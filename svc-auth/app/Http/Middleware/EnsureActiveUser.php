<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if ($user && !$user->is_active) {
            return response()->json(['message' => 'Account is deactivated'], 403);
        }

        return $next($request);
    }
}
