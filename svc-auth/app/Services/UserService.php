<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserService
{
    public function list(array $filters): LengthAwarePaginator
    {
        return User::with('roles')
            ->when($filters['role'] ?? null, fn($q, $r) => $q->role($r))
            ->when($filters['search'] ?? null, fn($q, $s) =>
                $q->where('full_name', 'ilike', "%{$s}%")->orWhere('email', 'ilike', "%{$s}%"))
            ->paginate($filters['per_page'] ?? 20);
    }

    public function findOrFail(string $id): User
    {
        return User::findOrFail($id);
    }

    public function update(User $user, array $data): User
    {
        if (!empty($data['password'])) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
        }
        $user->update($data);
        return $user;
    }

    public function assignRole(User $user, string $role): void
    {
        $user->syncRoles([$role]);
    }

    public function delete(string $id): void
    {
        User::findOrFail($id)->delete();
    }
}
