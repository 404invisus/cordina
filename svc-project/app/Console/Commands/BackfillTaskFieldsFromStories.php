<?php

namespace App\Console\Commands;

use App\Models\Story;
use App\Models\Task;
use Illuminate\Console\Command;

/**
 * Task yang dibuat lewat "Add Backlog" di Kanban Board sebelum fix
 * 7d2f2ad tidak mewarisi description, due_date, dan estimated_hours dari
 * story sumbernya. Command ini menyalin field-field itu dari story ke
 * task existing yang punya story_id dan field-nya masih kosong. Idempotent:
 * hanya mengisi field yang null/kosong, tidak menimpa yang sudah diisi.
 */
class BackfillTaskFieldsFromStories extends Command
{
    protected $signature = 'tasks:backfill-from-stories {--dry-run : Cetak rencana perubahan tanpa menulis}';
    protected $description = 'Salin description, due_date, dan estimated_hours dari story ke task yang berasal darinya';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $tasks = Task::whereNotNull('story_id')
            ->where(function ($q) {
                $q->whereNull('description')
                    ->orWhere('description', '')
                    ->orWhereNull('due_date')
                    ->orWhereNull('estimated_hours')
                    ->orWhere('estimated_hours', 0);
            })
            ->get();

        $updated = 0;
        $skipped = 0;

        foreach ($tasks as $task) {
            $story = Story::find($task->story_id);
            if (!$story) {
                $skipped++;
                continue;
            }

            $updates = [];

            if (empty($task->description) && !empty($story->description)) {
                $updates['description'] = $story->description;
            }
            if (empty($task->due_date) && !empty($story->due_date)) {
                $updates['due_date'] = $story->due_date;
            }
            if ((empty($task->estimated_hours) || (float) $task->estimated_hours === 0.0) && !empty($story->estimated_hours)) {
                $updates['estimated_hours'] = $story->estimated_hours;
            }

            if (empty($updates)) {
                $skipped++;
                continue;
            }

            $this->line(sprintf(
                '[%s] %s → %s',
                $dry ? 'DRY' : 'UPD',
                $task->id,
                implode(', ', array_keys($updates))
            ));

            if (!$dry) {
                $task->update($updates);
            }
            $updated++;
        }

        $this->info(sprintf(
            'Selesai. %d task %s, %d dilewati (%d total task punya story_id).',
            $updated,
            $dry ? 'akan diupdate' : 'diupdate',
            $skipped,
            $tasks->count()
        ));

        return self::SUCCESS;
    }
}
