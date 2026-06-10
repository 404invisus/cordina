<?php
namespace App\Services;
use App\Models\Sprint;
class SprintService
{
    public function listByProject(string $projectId)
    {
        return Sprint::where('project_id', $projectId)
            ->orderBy('start_date')
            ->get();
    }
    public function create(string $projectId, array $data): Sprint
    {
        return Sprint::create(array_merge($data, ['project_id' => $projectId, 'status' => 'planned']));
    }
    public function findOrFail(string $id): Sprint
    {
        return Sprint::with(['project'])->findOrFail($id);
    }
    public function start(Sprint $sprint): Sprint
    {
        abort_if($sprint->status !== 'planned', 422, 'Sprint must be in planned state to start');
        $sprint->update(['status' => 'active']);
        return $sprint->fresh();
    }
    public function complete(Sprint $sprint): Sprint
    {
        abort_if($sprint->status !== 'active', 422, 'Sprint must be active to complete');
        $sprint->update(['status' => 'completed']);
        return $sprint->fresh();
    }
}
