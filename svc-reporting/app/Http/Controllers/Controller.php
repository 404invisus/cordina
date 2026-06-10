<?php
namespace App\Http\Controllers;

abstract class Controller
{
    protected function authId(): ?string
    {
        $token = request()->bearerToken();
        if (!$token) return null;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        $payload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)), true);
        return $payload['sub'] ?? null;
    }

    protected function authRoles(): array
    {
        $token = request()->bearerToken();
        if (!$token) return [];
        $parts = explode('.', $token);
        if (count($parts) !== 3) return [];
        $payload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)), true);
        return (array) ($payload['roles'] ?? []);
    }

    protected function hasRole(array $allowed): bool
    {
        return !empty(array_intersect($this->authRoles(), $allowed));
    }

    protected function requireRole(array $allowed): void
    {
        abort_if(!$this->hasRole($allowed), 403, 'Forbidden: insufficient role');
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
