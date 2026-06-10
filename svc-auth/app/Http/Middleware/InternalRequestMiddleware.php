<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;

class InternalRequestMiddleware
{
    private const ALLOWED_NETWORKS = ['172.', '10.', '127.'];

    public function handle(Request $request, Closure $next)
    {
        $ip = $request->ip();
        $allowed = collect(self::ALLOWED_NETWORKS)
            ->contains(fn($prefix) => str_starts_with($ip, $prefix));

        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}
