<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function authId(): ?string
    {
        return auth()->id();
    }

    protected function authRoles(): array
    {
        try {
            return (array) auth()->payload()->get('roles');
        } catch (\Throwable) {
            return [];
        }
    }

    protected function hasRole(array $allowed): bool
    {
        return !empty(array_intersect($this->authRoles(), $allowed));
    }

    protected function requireRole(array $allowed): void
    {
        abort_if(!$this->hasRole($allowed), 403, 'Forbidden: insufficient role');
    }
}
