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
}
