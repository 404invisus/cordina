<?php
namespace App\Services;
use App\Events\TaskAssigned;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaskService
{
    public function list(array $filters): LengthAwarePaginator
    {
        return Task::with(['story', 'subtasks', 'timeLogs'])
            ->when($filters['sprint_id']   ?? null, fn($q, $v) => $q->where('sprint_id', $v))
            ->when($filters['assignee_id'] ?? null, fn($q, $v) => $q->where('assignee_id', $v))
            ->when($filters['status']      ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['type']        ?? null, fn($q, $v) => $q->where('type', $v))
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data, string $reporterId): Task
    {
        $task = Task::create(array_merge($data, ['reporter_id' => $reporterId, 'status' => $data['status'] ?? 'todo']));
        if (!empty($data['assignee_id'])) {
            event(new TaskAssigned($task->fresh(), $data['assignee_id']));
        }
        return $task;
    }

    public function findOrFail(string $id): Task
    {
        return Task::with(['story', 'subtasks', 'blockedBy', 'blocks', 'comments', 'timeLogs'])->findOrFail($id);
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);
        return $task->fresh();
    }

    public function assign(Task $task, string $assigneeId): Task
    {
        $task->update(['assignee_id' => $assigneeId]);
        event(new TaskAssigned($task->fresh(), $assigneeId));
        return $task->fresh();
    }

    public function logTime(Task $task, string $userId, array $data): TimeLog
    {
        $log = TimeLog::create([
            'task_id'      => $task->id,
            'user_id'      => $userId,
            'logged_hours' => $data['logged_hours'],
            'description'  => $data['description'] ?? null,
            'logged_at'    => $data['logged_at'] ?? today(),
        ]);
        $task->increment('actual_hours', $data['logged_hours']);
        return $log;
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
