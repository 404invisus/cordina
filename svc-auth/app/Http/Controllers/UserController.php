<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $users = $this->userService->list($request->all());
        return response()->json(['data' => UserResource::collection($users)]);
    }

    public function show(string $id): JsonResponse
    {
        $user = $this->userService->findOrFail($id);
        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(UpdateUserRequest $request, string $id): JsonResponse
    {
        $user = $this->userService->findOrFail($id);
        // Hanya diri sendiri atau kepala_balai yang bisa update
        abort_if(
            $user->id !== $this->authId() && !$this->hasRole(['kepala_balai']),
            403, 'Forbidden'
        );
        $updated = $this->userService->update($user, $request->validated());
        return response()->json(['data' => new UserResource($updated)]);
    }

    public function assignRole(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai']);
        $request->validate([
            'role' => 'required|string|in:kepala_balai,kepala_seksi,project_manager,scrum_master,staff'
        ]);
        $user = $this->userService->findOrFail($id);
        $this->userService->assignRole($user, $request->role);
        return response()->json(['data' => new UserResource($user->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai']);
        $this->userService->delete($id);
        return response()->json(null, 204);
    }

    public function setTelegram(Request $request): JsonResponse
    {
        $request->validate(['telegram_chat_id' => 'required|string']);
        $user = \App\Models\User::findOrFail($this->authId());
        $user->update(['telegram_chat_id' => $request->telegram_chat_id]);
        return response()->json(['data' => new UserResource($user->fresh())]);
    }

    public function setTelegramAdmin(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai']);
        $request->validate(['telegram_chat_id' => 'required|string']);
        $user = $this->userService->findOrFail($id);
        $user->update(['telegram_chat_id' => $request->telegram_chat_id]);
        return response()->json(['data' => new UserResource($user->fresh())]);
    }
}
