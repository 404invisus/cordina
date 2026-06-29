<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\Admin\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(private readonly AdminUserService $adminUserService) {}

    /**
     * GET /v1/admin/users
     * Query params: search, role, division, is_active, per_page, sort_by, sort_dir
     */
    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'search'   => 'sometimes|string|max:100',
            'role'     => 'sometimes|string',
            'division' => 'sometimes|string|max:100',
            'is_active'=> 'sometimes|boolean',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'sort_by'  => 'sometimes|in:full_name,email,created_at,division',
            'sort_dir' => 'sometimes|in:asc,desc',
        ]);

        $users = $this->adminUserService->listWithFilters($request->all());

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    /**
     * GET /v1/admin/users/{id}
     */
    public function show(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $user = $this->adminUserService->findOrFail($id);

        return response()->json(['data' => new UserResource($user)]);
    }

    /**
     * POST /v1/admin/users
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $data = $request->validate([
            'full_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8|regex:/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/',
            'role'      => 'required|string|in:kepala_balai,kepala_seksi,project_manager,scrum_master,staff,administrator',
            'division'  => 'sometimes|nullable|string|max:100',
            'position'  => 'sometimes|nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $user = $this->adminUserService->createUser($data);

        return response()->json(['data' => new UserResource($user)], 201);
    }

    /**
     * PATCH /v1/admin/users/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $data = $request->validate([
            'full_name'        => 'sometimes|string|max:255',
            'email'            => 'sometimes|email|unique:users,email,' . $id,
            'password'         => 'sometimes|string|min:8|regex:/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/',
            'division'         => 'sometimes|nullable|string|max:100',
            'position'         => 'sometimes|nullable|string|max:100',
            'telegram_chat_id' => 'sometimes|nullable|string|max:50',
            'avatar'           => 'sometimes|nullable|string|url',
            'is_active'        => 'sometimes|boolean',
        ]);

        $user = $this->adminUserService->findOrFail($id);
        $updated = $this->adminUserService->updateUser($user, $data);

        return response()->json(['data' => new UserResource($updated)]);
    }

    /**
     * PATCH /v1/admin/users/{id}/role
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'role' => 'required|string|in:kepala_balai,kepala_seksi,project_manager,scrum_master,staff,administrator',
        ]);

        $user = $this->adminUserService->findOrFail($id);
        $this->adminUserService->assignRole($user, $request->role);

        return response()->json(['data' => new UserResource($user->fresh())]);
    }

    /**
     * PATCH /v1/admin/users/{id}/status
     * Body: { "is_active": true|false }
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $user = $this->adminUserService->findOrFail($id);

        // Cegah admin suspend dirinya sendiri
        abort_if($user->id === $this->authId(), 422, 'Cannot change your own status');

        $user->update(['is_active' => $request->is_active]);

        return response()->json([
            'data'    => new UserResource($user->fresh()),
            'message' => $request->is_active ? 'User activated' : 'User suspended',
        ]);
    }

    /**
     * DELETE /v1/admin/users/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        // Cegah admin hapus dirinya sendiri
        abort_if($id === $this->authId(), 422, 'Cannot delete your own account');

        $this->adminUserService->deleteUser($id);

        return response()->json(null, 204);
    }

    /**
     * GET /v1/admin/users/stats
     */
    public function stats(): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        return response()->json([
            'data' => $this->adminUserService->getStats(),
        ]);
    }
}
