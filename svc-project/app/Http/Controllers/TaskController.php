<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => TaskResource::collection(
            $this->service->list($request->all())
        )]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $task = $this->service->create($request->validated(), $this->authId());
        return response()->json(['data' => new TaskResource($task)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => new TaskResource(
            $this->service->findOrFail($id)
        )]);
    }

    public function update(UpdateTaskRequest $request, string $id): JsonResponse
    {
        $task  = $this->service->findOrFail($id);
        $roles = $this->authRoles();
        $isStaffOnly = empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']));
        if ($isStaffOnly) {
            abort_if($task->assignee_id !== $this->authId(), 403, 'Staff hanya bisa update task milik sendiri');
            $allowed = $request->only(['status', 'actual_hours']);
            return response()->json(['data' => new TaskResource($this->service->update($task, $allowed))]);
        }
        return response()->json(['data' => new TaskResource(
            $this->service->update($task, $request->validated())
        )]);
    }

    public function assign(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $request->validate(['assignee_id' => 'required|uuid']);
        $task = $this->service->findOrFail($id);
        return response()->json(['data' => new TaskResource(
            $this->service->assign($task, $request->assignee_id)
        )]);
    }

    public function removeAssignee(Request $request, string $id, string $userId): JsonResponse
    {
        $this->requireRole(["kepala_balai", "kepala_seksi", "project_manager", "scrum_master"]);
        \App\Models\TaskAssignee::where("task_id", $id)->where("user_id", $userId)->delete();
        $task = $this->service->findOrFail($id);
        $first = \App\Models\TaskAssignee::where("task_id", $id)->first();
        $task->update(["assignee_id" => $first?->user_id]);
        return response()->json(["data" => new TaskResource($task->fresh(["assignees"]))]);
    }

    public function logTime(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'logged_hours' => 'required|numeric|min:0.25|max:24',
            'description'  => 'nullable|string|max:500',
            'logged_at'    => 'nullable|date|before_or_equal:today',
        ]);
        $task = $this->service->findOrFail($id);
        $this->service->logTime($task, $this->authId(), $request->all());
        return response()->json(['message' => 'Time logged successfully']);
    }

    public function addDependency(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $request->validate([
            'depends_on_task_id' => 'required|uuid|exists:tasks,id|different:id',
        ]);
        $dependsOnId = $request->depends_on_task_id;
        $wouldCreateCycle = DB::table('task_dependencies')
            ->where('task_id', $dependsOnId)
            ->where('depends_on_task_id', $id)
            ->exists();
        abort_if($wouldCreateCycle, 422, 'Circular dependency terdeteksi');
        DB::table('task_dependencies')->insertOrIgnore([
            'task_id'            => $id,
            'depends_on_task_id' => $dependsOnId,
        ]);
        return response()->json(['data' => new TaskResource($this->service->findOrFail($id))]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $task = $this->service->findOrFail($id);
        $this->service->delete($task);
        return response()->json(null, 204);
    }
}
