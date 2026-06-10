<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WorkloadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminWorkloadController extends Controller
{
    public function __construct(private readonly WorkloadService $service) {}

    /**
     * GET /v1/admin/workload/summary?sprint_id=xxx
     * Workload semua user dalam satu sprint
     */
    public function summary(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate(['sprint_id' => 'required|uuid']);

        return response()->json([
            'data' => $this->service->summary($request->sprint_id),
        ]);
    }

    /**
     * GET /v1/admin/workload/users/{user_id}?sprint_id=xxx
     * Detail workload satu user di satu sprint
     */
    public function userSummary(Request $request, string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate(['sprint_id' => 'required|uuid']);

        return response()->json([
            'data' => $this->service->userSummary($userId, $request->sprint_id),
        ]);
    }

    /**
     * GET /v1/admin/workload/users/{user_id}/assignments
     * Semua assignment user lintas sprint & project
     */
    public function userAssignments(Request $request, string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        return response()->json([
            'data' => $this->service->assignmentsByUser($userId),
        ]);
    }

    /**
     * GET /v1/admin/workload/projects/{project_id}
     * Distribusi workload semua user di satu project
     */
    public function projectWorkload(Request $request, string $projectId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        return response()->json([
            'data' => $this->service->assignmentsByProject($projectId),
        ]);
    }

    /**
     * GET /v1/admin/workload/capacity?sprint_id=xxx
     * Overview kapasitas semua user di satu sprint
     */
    public function capacityOverview(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate(['sprint_id' => 'required|uuid']);

        $capacities = DB::table('user_capacities')
            ->where('sprint_id', $request->sprint_id)
            ->get();

        $totalAvailable  = $capacities->sum('available_hours');
        $totalAllocated  = $capacities->sum('allocated_hours');

        return response()->json([
            'data' => [
                'sprint_id'       => $request->sprint_id,
                'total_users'     => $capacities->count(),
                'total_available' => round($totalAvailable, 2),
                'total_allocated' => round($totalAllocated, 2),
                'utilization_pct' => $totalAvailable > 0
                    ? round(($totalAllocated / $totalAvailable) * 100, 1)
                    : 0,
                'capacities'      => $capacities->values(),
            ],
        ]);
    }

    /**
     * POST /v1/admin/workload/capacity
     * Set kapasitas user untuk sprint tertentu
     */
    public function setCapacity(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate([
            'sprint_id'       => 'required|uuid',
            'user_id'         => 'required|uuid',
            'available_hours' => 'required|numeric|min:0',
            'allocated_hours' => 'sometimes|numeric|min:0',
        ]);

        return response()->json([
            'data' => $this->service->setCapacity($request->all()),
        ]);
    }

    /**
     * GET /v1/admin/workload/burndown?sprint_id=xxx
     */
    public function burndown(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate(['sprint_id' => 'required|uuid']);

        return response()->json([
            'data' => $this->service->burndown($request->sprint_id),
        ]);
    }

    /**
     * GET /v1/admin/workload/velocity?project_id=xxx
     */
    public function velocity(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate(['project_id' => 'required|uuid']);

        return response()->json([
            'data' => $this->service->velocity($request->project_id),
        ]);
    }
}
