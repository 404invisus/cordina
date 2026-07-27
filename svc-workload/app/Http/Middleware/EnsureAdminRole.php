<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminRole
{
    private const ADMIN_ROLES = ['administrator', 'kepala_balai'];

    public function handle(Request $request, Closure $next)
    {
        abort_if(
            empty(array_intersect($this->roles($request), self::ADMIN_ROLES)),
            403, 'Forbidden: admin only'
        );
        return $next($request);
    }

    private function roles(Request $request): array
    {
        $r = (array) ($request->attributes->get('jwt_roles') ?? []);
        if (!empty($r)) return $r;

        try {
            $r = (array) auth()->payload()->get('roles');
            if (!empty($r)) return $r;
        } catch (\Throwable) {}

        $token = $request->bearerToken();
        if (!$token) return [];
        $parts = explode('.', $token);
        if (count($parts) !== 3) return [];
        $b = strtr($parts[1], '-_', '+/');
        $b = str_pad($b, strlen($b) + ((4 - strlen($b) % 4) % 4), '=');
        return (array) (json_decode(base64_decode($b), true)['roles'] ?? []);
    }
}
