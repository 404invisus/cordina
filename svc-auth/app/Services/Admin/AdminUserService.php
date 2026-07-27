<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class AdminUserService
{
    public function listWithFilters(array $filters): LengthAwarePaginator
    {
        $sortBy  = in_array($filters['sort_by'] ?? '', ['full_name', 'email', 'created_at', 'division'])
            ? $filters['sort_by']
            : 'created_at';
        $sortDir = ($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return User::with('roles')
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where(function ($q2) use ($s) {
                    $q2->where('full_name', 'ilike', "%{$s}%")
                       ->orWhere('email', 'ilike', "%{$s}%")
                       ->orWhere('division', 'ilike', "%{$s}%");
                });
            })
            ->when($filters['role'] ?? null, fn($q, $r) =>
                $q->whereExists(fn($sub) => $sub->selectRaw('1')
                    ->from('model_has_roles as mhr')
                    ->join('roles as rl', 'rl.id', '=', 'mhr.role_id')
                    ->whereRaw('mhr.model_id::text = users.id::text')
                    ->where('rl.name', $r)))
            ->when($filters['division'] ?? null, fn($q, $d) => $q->where('division', $d))
            ->when(isset($filters['is_active']), fn($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->orderBy($sortBy, $sortDir)
            ->paginate($filters['per_page'] ?? 20);
    }

    public function findOrFail(string $id): User
    {
        return User::with('roles')->findOrFail($id);
    }

    public function createUser(array $data): User
    {
        $role = $data['role'];
        unset($data['role']);

        $data['password'] = Hash::make($data['password']);
        $data['is_active'] = $data['is_active'] ?? true;

        $user = User::create($data);
        $user->assignRole(\Spatie\Permission\Models\Role::findByName($role, 'api'));

        return $user->fresh('roles');
    }

    public function updateUser(User $user, array $data): User
    {
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return $user->fresh('roles');
    }

    public function assignRole(User $user, string $role): void
    {
        $user->syncRoles([\Spatie\Permission\Models\Role::findByName($role, 'api')]);
    }

    public function deleteUser(string $id): void
    {
        $user = User::findOrFail($id);

        // lepas role agar tidak jadi baris yatim di model_has_roles
        $user->syncRoles([]);
        \Illuminate\Support\Facades\DB::table('model_has_permissions')
            ->where('model_id', (string) $user->id)->delete();

        $user->delete();
    }

    public function getStats(): array
    {
        $total   = User::count();
        $active  = User::where('is_active', true)->count();
        $byRole = \Illuminate\Support\Facades\DB::table('roles')
            ->leftJoin('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->leftJoin('users', function ($join) {
                $join->on(\Illuminate\Support\Facades\DB::raw('users.id::text'), '=', 'model_has_roles.model_id')
                     ->whereNull('users.deleted_at');
            })
            ->selectRaw('roles.name, count(users.id) as total')
            ->groupBy('roles.name')
            ->pluck('total', 'name');
        $byDivision = User::selectRaw('division, count(*) as total')
            ->whereNotNull('division')
            ->groupBy('division')
            ->pluck('total', 'division');

        return [
            'total_users'    => $total,
            'active_users'   => $active,
            'inactive_users' => $total - $active,
            'by_role'        => $byRole,
            'by_division'    => $byDivision,
        ];
    }
}
