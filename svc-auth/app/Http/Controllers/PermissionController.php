<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserExtraPermission;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function __construct(private readonly PermissionService $service) {}

    // GET /v1/permissions/definitions
    public function definitions(): JsonResponse
    {
        return response()->json(['data' => PermissionService::ALL_PERMISSIONS]);
    }

    // GET /v1/permissions/users/{userId}
    public function userPermissions(string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $user  = User::with('roles')->findOrFail($userId);
        $roles = $user->getRoleNames()->toArray();

        $defaultPerms = [];
        foreach ($roles as $role) {
            $defaultPerms = array_merge($defaultPerms, PermissionService::ROLE_PERMISSIONS[$role] ?? []);
        }

        $extras = UserExtraPermission::where('user_id', $userId)->get();
        $effective = $this->service->getUserPermissions($userId, $roles);

        return response()->json(['data' => [
            'user_id'     => $userId,
            'roles'       => $roles,
            'default'     => array_unique($defaultPerms),
            'extra'       => $extras,
            'effective'   => $effective,
        ]]);
    }

    // POST /v1/permissions/users/{userId}
    public function setPermission(Request $request, string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate([
            'permission' => 'required|string',
            'granted'    => 'required|boolean',
        ]);

        abort_if(
            !array_key_exists($request->permission, PermissionService::ALL_PERMISSIONS),
            422, 'Permission tidak valid'
        );

        $this->service->setPermission(
            $userId,
            $request->permission,
            $request->granted,
            $this->authId()
        );

        // Invalidate Redis cache
        \Illuminate\Support\Facades\Cache::forget("perm:{$userId}");

        return response()->json(['message' => 'Permission updated']);
    }

    // DELETE /v1/permissions/users/{userId}/reset
    public function resetPermissions(string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $this->service->resetPermissions($userId);
        \Illuminate\Support\Facades\Cache::forget("perm:{$userId}");
        return response()->json(['message' => 'Permissions reset to role defaults']);
    }

    // GET /v1/auth/me/permissions (untuk frontend cek permission sendiri)
    public function myPermissions(Request $request): JsonResponse
    {
        $userId = $this->authId();
        $roles  = $this->authRoles();
        $perms  = $this->service->getUserPermissions($userId, $roles);
        return response()->json(['data' => $perms]);
    }
}
