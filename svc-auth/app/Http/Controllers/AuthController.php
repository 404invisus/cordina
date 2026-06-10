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
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
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
        auth()->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(): JsonResponse
    {
        $token = auth()->refresh();
        return response()->json(['data' => ['access_token' => $token]]);
    }
}
