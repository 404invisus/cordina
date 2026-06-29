<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            // Cek apakah token sudah di-blacklist
            $token = JWTAuth::getToken();
            if (Redis::exists('blacklist:' . $token)) {
                return response()->json(['message' => 'Token has been revoked'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token invalid or expired'], 401);
        }

        return $next($request);
    }
}
