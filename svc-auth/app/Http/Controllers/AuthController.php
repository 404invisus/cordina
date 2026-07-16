<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());
        return response()->json(['data' => new UserResource($user)], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->authService->login($request->validated());
        if (!$token) {
            // Log login gagal
            $failUser = \App\Models\User::where('email', $request->email)->first();
            \App\Services\ActivityLogService::log(
                $failUser?->id, 'login_failed',
                'Login gagal: email ' . $request->email,
                false, ['email' => $request->email], $request
            );
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
        $user = auth()->user();
        \App\Services\ActivityLogService::log(
            $user->id, 'login',
            'Login berhasil',
            true, ['email' => $user->email], $request
        );
        return response()->json([
            'data' => ['access_token' => $token, 'token_type' => 'bearer', 'expires_in' => config('jwt.ttl') * 60],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($request->user())]);
    }

    public function logout(): JsonResponse
    {
        try {
            $token = auth()->getToken();
            $exp   = auth()->payload()->get('exp');
            $ttl   = max(0, $exp - time());
            if ($ttl > 0) {
                \Illuminate\Support\Facades\Redis::setex(
                    'blacklist:' . $token,
                    $ttl,
                    '1'
                );
            }
        } catch (\Throwable) {}

        $userId = auth()->id();
        $email  = auth()->user()?->email;
        auth()->logout();
        \App\Services\ActivityLogService::log(
            $userId, 'logout', 'Logout berhasil', true, ['email' => $email], request()
        );
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(): JsonResponse
    {
        $token = auth()->refresh();
        return response()->json(['data' => ['access_token' => $token]]);
    }
}
