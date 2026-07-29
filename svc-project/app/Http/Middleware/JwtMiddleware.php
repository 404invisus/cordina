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
            [$headerB64, $payloadB64, $sigB64] = $parts;

            $header = json_decode($this->b64urlDecode($headerB64), true);
            if (!$header || ($header['alg'] ?? null) !== 'HS256') {
                throw new \Exception('Unsupported token algorithm');
            }

            $secret = config('services.jwt_secret');
            if (!$secret) {
                throw new \Exception('JWT secret not configured');
            }

            $expectedSig = $this->b64urlEncode(hash_hmac('sha256', "{$headerB64}.{$payloadB64}", $secret, true));
            if (!hash_equals($expectedSig, $sigB64)) {
                throw new \Exception('Invalid token signature');
            }

            $payload = json_decode($this->b64urlDecode($payloadB64), true);

            if (!$payload) {
                throw new \Exception('Invalid token payload');
            }

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

    private function b64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }

    private function b64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
