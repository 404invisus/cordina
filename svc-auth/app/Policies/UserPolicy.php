<?php
namespace App\Policies;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasAnyRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
    }

    public function view(User $authUser, User $target): bool
    {
        return $authUser->id === $target->id
            || $authUser->hasAnyRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
    }

    public function update(User $authUser, User $target): bool
    {
        return $authUser->id === $target->id || $authUser->hasRole('kepala_balai');
    }

    public function manageRoles(User $authUser): bool
    {
        return $authUser->hasRole('kepala_balai');
    }
}
