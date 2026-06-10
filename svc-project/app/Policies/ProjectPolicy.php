<?php
namespace App\Policies;
use App\Models\Project;

class ProjectPolicy
{
    private function getRole(): string
    {
        $claims = auth()->payload();
        return $claims->get('roles')[0] ?? 'staff';
    }

    public function create($user): bool
    {
        return in_array($this->getRole(), ['kepala_balai']);
    }

    public function view($user, Project $project): bool
    {
        return $project->members->contains('user_id', $user['id'] ?? $user);
    }

    public function update($user, Project $project): bool
    {
        return in_array($this->getRole(), ['kepala_balai', 'kepala_seksi', 'project_manager']);
    }

    public function delete($user, Project $project): bool
    {
        return $this->getRole() === 'kepala_balai';
    }

    public function manageSprint($user, Project $project): bool
    {
        return in_array($this->getRole(), ['kepala_seksi', 'project_manager', 'scrum_master']);
    }
}
