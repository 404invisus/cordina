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

    public function index(Request $request): JsonResponse
    {
        $projects = $this->service->listForUser($this->authId(), $request->all());
        return response()->json(['data' => ProjectResource::collection($projects)]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->requireRole(['kepala_balai']);
        $project = $this->service->create($request->validated(), $this->authId());
        return response()->json(['data' => new ProjectResource($project)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource($project)]);
    }

    public function update(UpdateProjectRequest $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource(
            $this->service->update($project, $request->validated())
        )]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai']);
        $project = $this->service->findOrFail($id);
        $this->service->delete($project);
        return response()->json(null, 204);
    }

    public function addMember(Request $request, string $projectId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
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
