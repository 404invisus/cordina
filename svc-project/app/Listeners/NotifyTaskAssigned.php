<?php
namespace App\Listeners;
use App\Events\TaskAssigned;
use Illuminate\Support\Facades\Http;

class NotifyTaskAssigned
{
    public function handle(TaskAssigned $event): void
    {
        $notifUrl = config('services.notification.url');
        if (!$notifUrl) return;

        $task = $event->task->load(['story.sprint', 'story.epic.project']);
        $sprint = $task->story?->sprint;
        $project = $task->story?->epic?->project;
        Http::post("{$notifUrl}/api/v1/notifications/send", [
            'user_id' => $event->assigneeId,
            'type'    => 'task.assigned',
            'payload' => [
                'task_id'      => $task->id,
                'task_title'   => $task->title,
                'project_name' => $project?->name ?? 'N/A',
                'sprint_name'  => $sprint?->name ?? 'N/A',
                'priority'     => $task->priority ?? 'normal',
            ],
        ]);
    }
}
