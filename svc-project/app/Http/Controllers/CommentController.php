<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CommentController extends Controller
{
    public function index(string $taskId): JsonResponse
    {
        $comments = Comment::where('task_id', $taskId)->orderBy('created_at')->get();
        return response()->json(['data' => $comments]);
    }

    public function store(Request $request, string $taskId): JsonResponse
    {
        $validated = $request->validate([
            'content'    => 'required|string|max:2000',
            'mentions'   => 'nullable|array',
            'mentions.*' => 'uuid',
        ]);
        $comment = Comment::create([
            'task_id'     => $taskId,
            'user_id'     => $this->authId(),
            'author_name' => $request->attributes->get('jwt_fullname') ?? 'User',
            'content'     => $validated['content'],
            'mentions'    => $validated['mentions'] ?? [],
        ]);
        if (!empty($validated['mentions'])) {
            $task = \App\Models\Task::find($taskId);
            foreach ($validated['mentions'] as $mentionedUserId) {
                rescue(function () use ($mentionedUserId, $taskId, $comment, $task) {
                    Http::timeout(3)->post(
                        rtrim(config('services.notification.url'), '/') . '/api/v1/notifications/send',
                        [
                            'user_id' => $mentionedUserId,
                            'type'    => 'task.mentioned',
                            'payload' => [
                                'task_id'     => $taskId,
                                'task_title'  => $task->title ?? 'N/A',
                                'comment_id'  => $comment->id,
                                'comment'     => $comment->content,
                                'mentioned_by'=> $comment->author_name,
                            ],
                        ]
                    );
                });
            }
        }
        return response()->json(['data' => $comment], 201);
    }

    public function update(Request $request, string $taskId, string $commentId): JsonResponse
    {
        $comment = Comment::where('task_id', $taskId)->findOrFail($commentId);
        abort_if(
            $comment->user_id !== $this->authId() && !$this->hasRole(['kepala_balai']),
            403, 'Hanya pemilik komentar yang bisa mengedit'
        );
        $comment->update($request->validate(['content' => 'required|string|max:2000']));
        return response()->json(['data' => $comment->fresh()]);
    }

    public function destroy(string $taskId, string $commentId): JsonResponse
    {
        $comment = Comment::where('task_id', $taskId)->findOrFail($commentId);
        abort_if(
            $comment->user_id !== $this->authId() && !$this->hasRole(['kepala_balai']),
            403, 'Hanya pemilik komentar yang bisa menghapus'
        );
        $comment->delete();
        return response()->json(null, 204);
    }
}
