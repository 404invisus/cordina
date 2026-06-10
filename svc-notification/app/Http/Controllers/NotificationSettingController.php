<?php

namespace App\Http\Controllers;

use App\Models\UserNotificationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSettingController extends Controller
{

    public function index(): JsonResponse
    {
        $settings = UserNotificationSetting::where('user_id', auth()->id())
            ->get(['id', 'channel', 'event_type', 'enabled']);

        if ($settings->isEmpty()) {
            $settings = $this->defaultSettings();
        }

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings'             => 'required|array|min:1',
            'settings.*.channel'   => 'required|in:telegram',
            'settings.*.event_type'=> 'required|in:task.assigned,task.commented,task.status_changed,sprint.started,sprint.completed',
            'settings.*.enabled'   => 'required|boolean',
        ]);

        $userId = auth()->id();

        foreach ($request->settings as $item) {
            UserNotificationSetting::updateOrCreate(
                [
                    'user_id'    => $userId,
                    'channel'    => $item['channel'],
                    'event_type' => $item['event_type'],
                ],
                [
                    'enabled'    => $item['enabled'],
                ]
            );
        }

        $updated = UserNotificationSetting::where('user_id', $userId)
            ->get(['id', 'channel', 'event_type', 'enabled']);

        return response()->json(['data' => $updated]);
    }

    private function defaultSettings(): array
    {
        $events = [
            'task.assigned',
            'task.commented',
            'task.status_changed',
            'sprint.started',
            'sprint.completed',
        ];

        return collect($events)->map(fn($event) => [
            'channel'    => 'telegram',
            'event_type' => $event,
            'enabled'    => true,
        ])->toArray();
    }
}
