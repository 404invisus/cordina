<?php
namespace App\Http\Controllers;
use App\Http\Requests\SendNotificationRequest;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function send(SendNotificationRequest $request): JsonResponse
    {
        $this->dispatcher->dispatch(
            userId:  $request->user_id,
            type:    $request->type,
            payload: $request->payload,
        );
        return response()->json(['message' => 'Notification queued']);
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = \App\Models\Notification::where('user_id', $request->attributes->get('jwt_user_id'))
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json(['data' => $notifications]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        \App\Models\Notification::where('user_id', $request->attributes->get('jwt_user_id'))
            ->where('status', 'sent')
            ->update(['status' => 'read']);
        return response()->json(['message' => 'All marked as read']);
    }

    public function markRead(string $id, Request $request): JsonResponse
    {
        \App\Models\Notification::where('id', $id)
            ->where('user_id', $request->attributes->get('jwt_user_id'))
            ->update(['status' => 'read']);
        return response()->json(['message' => 'Marked as read']);
    }
}
