<?php
namespace App\Services;
use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProjectService
{
    public function listForUser(string $userId, array $filters): LengthAwarePaginator
    {
        return Project::whereHas('members', fn($q) => $q->where('user_id', $userId))
            ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->with(['sprints', 'members'])
            ->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data, string $ownerId): Project
    {
        $project = Project::create(array_merge($data, ['owner_id' => $ownerId, 'status' => 'active']));
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id'    => $ownerId,
            'role'       => 'owner',
            'joined_at'  => now(),
        ]);
        return $project->load(['sprints', 'members']);
    }

    public function findOrFail(string $id): Project
    {
        return Project::with(['sprints', 'members', 'epics'])->findOrFail($id);
    }

    public function update(Project $project, array $data): Project
    {
        $project->update($data);
        return $project->fresh();
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }
}
