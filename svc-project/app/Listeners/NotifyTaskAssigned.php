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

        Http::post("{$notifUrl}/api/v1/notifications/send", [
            'user_id' => $event->assigneeId,
            'type'    => 'task.assigned',
            'payload' => [
                'task_id'    => $event->task->id,
                'task_title' => $event->task->title,
            ],
        ]);
    }
}
