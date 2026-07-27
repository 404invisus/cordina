<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\ProjectMember;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $service) {}

    protected function authorizeProjectAccess(string $projectId): void
    {
        if ($this->hasRole(['administrator', 'kepala_balai', 'kepala_seksi'])) return;

        $uid = $this->authId();
        abort_if(!$uid, 401, 'Unauthenticated');
        abort_if(
            !\Illuminate\Support\Facades\DB::table('project_members')
                ->where('project_id', $projectId)->where('user_id', $uid)->exists(),
            403, 'Forbidden: bukan anggota project ini'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $projects = $this->service->listForUser($this->authId(), $request->all());
        return response()->json(['data' => ProjectResource::collection($projects)]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->requirePermission('project.create');
        $project = $this->service->create($request->validated(), $this->authId());
        return response()->json(['data' => new ProjectResource($project)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $this->authorizeProjectAccess($id);
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource($project)]);
    }

    public function update(UpdateProjectRequest $request, string $id): JsonResponse
    {
        $this->requirePermission('project.edit');
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource(
            $this->service->update($project, $request->validated())
        )]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->requirePermission('project.delete');
        $project = $this->service->findOrFail($id);
        $this->service->delete($project);
        return response()->json(null, 204);
    }

    public function addMember(Request $request, string $projectId): JsonResponse
    {
        $this->requirePermission('project.manage_members');
        $validated = $request->validate([
            'user_id' => 'required|uuid',
            'role'    => 'required|in:manager,scrum_master,member',
        ]);
        $this->service->findOrFail($projectId);
        $member = ProjectMember::updateOrCreate(
            ['project_id' => $projectId, 'user_id' => $validated['user_id']],
            ['role' => $validated['role'], 'joined_at' => now()]
        );
        return response()->json(['data' => $member], 201);
    }
}
