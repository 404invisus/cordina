<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function authId(): ?string
    {
        return request()->attributes->get('jwt_user_id');
    }

    protected function authRoles(): array
    {
        $roles = request()->attributes->get('jwt_roles');
        if (!empty($roles)) {
            return (array) $roles;
        }
        return $this->decodeRolesFromToken();
    }

    protected function hasRole(array $allowed): bool
    {
        return !empty(array_intersect($this->authRoles(), $allowed));
    }

    protected function requireRole(array $allowed): void
    {
        abort_if(!$this->hasRole($allowed), 403, 'Forbidden: insufficient role');
    }

    protected function authorizeTaskAccess(string $taskId): void
    {
        if ($this->hasRole(['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'])) return;

        $DB   = \Illuminate\Support\Facades\DB::class;
        $task = \Illuminate\Support\Facades\DB::table('tasks')->where('id', $taskId)->first();
        abort_if(!$task, 404, 'Task tidak ditemukan');

        $uid = $this->authId();
        if ($task->assignee_id === $uid || $task->reporter_id === $uid) return;
        if (\Illuminate\Support\Facades\DB::table('task_assignees')
                ->where('task_id', $taskId)->where('user_id', $uid)->exists()) return;

        $projectId = \Illuminate\Support\Facades\Schema::hasColumn('tasks', 'project_id')
            ? ($task->project_id ?? null)
            : \Illuminate\Support\Facades\DB::table('sprints')->where('id', $task->sprint_id)->value('project_id');

        abort_if(
            !$projectId || !\Illuminate\Support\Facades\DB::table('project_members')
                ->where('project_id', $projectId)->where('user_id', $uid)->exists(),
            403, 'Forbidden: task ini bukan milik Anda'
        );
    }

    protected function authorizeEpicAccess(string $epicId): void
    {
        $pid = \Illuminate\Support\Facades\DB::table('epics')->where('id', $epicId)->value('project_id');
        abort_if(!$pid, 404, 'Epic tidak ditemukan');
        $this->authorizeProjectAccess($pid);
    }

    protected function authorizeProjectAccess(string $projectId): void
    {
        if ($this->hasRole(['administrator', 'kepala_balai', 'kepala_seksi'])) return;

        $uid = $this->authId();
        abort_if(!$uid, 401, 'Unauthenticated');
        abort_if(
            !\Illuminate\Support\Facades\DB::table('project_members')
                ->where('project_id', $projectId)->where('user_id', $uid)->exists(),
            403, 'Forbidden: bukan anggota project ini'
        );
    }

    protected function hasPermission(string $permission): bool
    {
        $userId = $this->authId();
        $roles  = $this->authRoles();
        if (!$userId) return false;

        $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');

        static $cache = [];
        $cacheKey = "{$userId}:{$permission}";
        if (isset($cache[$cacheKey])) return $cache[$cacheKey];

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)
                ->post("{$authUrl}/api/v1/internal/check-permission", [
                    'user_id'    => $userId,
                    'roles'      => $roles,
                    'permission' => $permission,
                ]);
            $result = $response->json('data.allowed', false);
        } catch (\Throwable) {
            $result = $this->hasRole(['kepala_balai', 'administrator']);
        }

        $cache[$cacheKey] = $result;
        return $result;
    }

    protected function requirePermission(string $permission): void
    {
        abort_if(!$this->hasPermission($permission), 403, "Forbidden: missing permission [{$permission}]");
    }

    protected function getRolesFromJwt(): array
    {
        return $this->authRoles();
    }

    private function decodeRolesFromToken(): array
    {
        try {
            $token = request()->bearerToken();
            if (!$token) return [];
            $parts = explode('.', $token);
            if (count($parts) !== 3) return [];
            $payload = json_decode(
                base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)),
                true
            );
            return (array) ($payload['roles'] ?? []);
        } catch (\Throwable) {
            return [];
        }
    }
}
