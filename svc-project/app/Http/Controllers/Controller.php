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
