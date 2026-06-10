<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Token not provided'], 401);
        }

        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                throw new \Exception('Invalid token format');
            }

            $payload = json_decode(
                base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)),
                true
            );

            if (!$payload) throw new \Exception('Invalid token payload');

            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return response()->json(['message' => 'Token expired'], 401);
            }

            $request->attributes->set('jwt_user_id',  $payload['sub']       ?? null);
            $request->attributes->set('jwt_roles',    $payload['roles']     ?? []);
            $request->attributes->set('jwt_email',    $payload['email']     ?? null);
            $request->attributes->set('jwt_fullname', $payload['full_name'] ?? null);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Token invalid'], 401);
        }

        return $next($request);
    }
}
