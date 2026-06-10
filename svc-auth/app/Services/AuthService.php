<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): User
    {
        $user = User::create([
            'full_name' => $data['full_name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'division'  => $data['division'] ?? null,
            'position'  => $data['position'] ?? null,
        ]);
        $user->assignRole('staff'); // default role
        return $user;
    }

    public function login(array $credentials): ?string
    {
        return auth()->attempt([
            'email'    => $credentials['email'],
            'password' => $credentials['password'],
        ]) ?: null;
    }
}
