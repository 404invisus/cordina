<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectService;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly TaskService    $taskService,
    ) {}

    /**
     * GET /v1/admin/projects
     * Semua project (bukan hanya milik user yang login)
     */
    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'status'   => 'sometimes|in:active,inactive,completed,archived',
            'search'   => 'sometimes|string|max:100',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $projects = Project::with(['sprints', 'members'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, fn($q, $s) =>
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('description', 'ilike', "%{$s}%")
            )
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => ProjectResource::collection($projects->items()),
            'meta' => [
                'total'        => $projects->total(),
                'per_page'     => $projects->perPage(),
                'current_page' => $projects->currentPage(),
                'last_page'    => $projects->lastPage(),
            ],
        ]);
    }

    /**
     * GET /v1/admin/projects/stats
     * Statistik ringkasan semua project
     */
    public function stats(): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $byStatus = Project::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $taskStats = DB::table('tasks')
            ->whereNull('deleted_at')
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $overdueTasks = DB::table('tasks')
            ->whereNull('deleted_at')
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        return response()->json([
            'data' => [
                'projects_by_status' => $byStatus,
                'total_projects'     => Project::count(),
                'tasks_by_status'    => $taskStats,
                'overdue_tasks'      => $overdueTasks,
            ],
        ]);
    }

    /**
     * GET /v1/admin/projects/{id}
     * Detail project beserta sprints, epics, members
     */
    public function show(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $project = $this->projectService->findOrFail($id);

        return response()->json(['data' => new ProjectResource($project)]);
    }

    /**
     * PATCH /v1/admin/projects/{id}
     * Update project (status, name, dll)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status'      => 'sometimes|in:active,inactive,completed,archived',
            'start_date'  => 'sometimes|nullable|date',
            'end_date'    => 'sometimes|nullable|date|after_or_equal:start_date',
        ]);

        $project = $this->projectService->findOrFail($id);
        $updated = $this->projectService->update($project, $data);

        return response()->json(['data' => new ProjectResource($updated)]);
    }

    /**
     * DELETE /v1/admin/projects/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $project = $this->projectService->findOrFail($id);
        $this->projectService->delete($project);

        return response()->json(null, 204);
    }

    /**
     * GET /v1/admin/projects/{id}/tasks
     * Semua task dalam project (lintas sprint)
     */
    public function tasks(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'status'      => 'sometimes|string',
            'assignee_id' => 'sometimes|uuid',
            'sprint_id'   => 'sometimes|uuid',
            'type'        => 'sometimes|string',
            'per_page'    => 'sometimes|integer|min:1|max:100',
        ]);

        // Ambil semua sprint_id milik project ini
        $sprintIds = DB::table('sprints')
            ->where('project_id', $id)
            ->pluck('id');

        $tasks = Task::with(['story'])
            ->whereIn('sprint_id', $sprintIds)
            ->when($request->status,      fn($q, $v) => $q->where('status', $v))
            ->when($request->assignee_id, fn($q, $v) => $q->where('assignee_id', $v))
            ->when($request->sprint_id,   fn($q, $v) => $q->where('sprint_id', $v))
            ->when($request->type,        fn($q, $v) => $q->where('type', $v))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => TaskResource::collection($tasks->items()),
            'meta' => [
                'total'        => $tasks->total(),
                'per_page'     => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
            ],
        ]);
    }

    /**
     * GET /v1/admin/projects/{id}/members
     * Daftar member project
     */
    public function members(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $members = DB::table('project_members')
            ->where('project_id', $id)
            ->get();

        return response()->json(['data' => $members]);
    }

    /**
     * GET /v1/admin/tasks
     * Semua task lintas project dengan filter
     */
    public function allTasks(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'status'      => 'sometimes|string',
            'assignee_id' => 'sometimes|uuid',
            'sprint_id'   => 'sometimes|uuid',
            'type'        => 'sometimes|string',
            'overdue'     => 'sometimes|boolean',
            'per_page'    => 'sometimes|integer|min:1|max:100',
        ]);

        $tasks = Task::with(['story'])
            ->when($request->status,      fn($q, $v) => $q->where('status', $v))
            ->when($request->assignee_id, fn($q, $v) => $q->where('assignee_id', $v))
            ->when($request->sprint_id,   fn($q, $v) => $q->where('sprint_id', $v))
            ->when($request->type,        fn($q, $v) => $q->where('type', $v))
            ->when($request->overdue, fn($q) =>
                $q->where('status', '!=', 'done')
                  ->whereNotNull('due_date')
                  ->where('due_date', '<', now()->toDateString())
            )
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => TaskResource::collection($tasks->items()),
            'meta' => [
                'total'        => $tasks->total(),
                'per_page'     => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
            ],
        ]);
    }
}
