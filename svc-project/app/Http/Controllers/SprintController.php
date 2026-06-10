<?php
namespace App\Http\Controllers;
use App\Http\Requests\StoreSprintRequest;
use App\Http\Resources\SprintResource;
use App\Services\SprintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class SprintController extends Controller
{
    public function __construct(private readonly SprintService $service) {}

    private function canManageSprint(Request $request): bool
    {
        $roles = $request->attributes->get('jwt_roles', []);
        return count(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'])) > 0;
    }

    public function index(string $projectId): JsonResponse
    {
        return response()->json(['data' => SprintResource::collection(
            $this->service->listByProject($projectId)
        )]);
    }

    public function store(StoreSprintRequest $request, string $projectId): JsonResponse
    {
        if (!$this->canManageSprint($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $sprint = $this->service->create($projectId, $request->validated());
        return response()->json(['data' => new SprintResource($sprint)], 201);
    }

    public function start(Request $request, string $projectId, string $sprintId): JsonResponse
    {
        if (!$this->canManageSprint($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $sprint = $this->service->findOrFail($sprintId);
        return response()->json(['data' => new SprintResource($this->service->start($sprint))]);
    }

    public function complete(Request $request, string $projectId, string $sprintId): JsonResponse
    {
        if (!$this->canManageSprint($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $sprint = $this->service->findOrFail($sprintId);
        return response()->json(['data' => new SprintResource($this->service->complete($sprint))]);
    }
}
