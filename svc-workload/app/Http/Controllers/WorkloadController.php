<?php
namespace App\Http\Controllers;

use App\Services\WorkloadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkloadController extends Controller
{
    public function __construct(private readonly WorkloadService $service) {}

    public function summary(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->summary($request->sprint_id)]);
    }

    public function mySummary(Request $request): JsonResponse
    {
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->userSummary($this->authId(), $request->sprint_id)]);
    }

    public function setCapacity(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        $request->validate([
            'sprint_id'       => 'required|uuid',
            'user_id'         => 'required|uuid',
            'available_hours' => 'required|numeric|min:0',
        ]);
        return response()->json(['data' => $this->service->setCapacity($request->all())]);
    }

    public function burndown(Request $request): JsonResponse
    {
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->burndown($request->sprint_id)]);
    }

    public function velocity(Request $request): JsonResponse
    {
        $request->validate(['project_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->velocity($request->project_id)]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);
        $userId = $this->hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'])
            ? ($request->user_id ?? $this->authId())
            : $this->authId();
        return response()->json(['data' => $this->service->calendar($userId, $request->from, $request->to)]);
    }

    // Semua task user di semua project
    public function assignmentsByUser(Request $request, string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        return response()->json(['data' => $this->service->assignmentsByUser($userId)]);
    }

    // Distribusi assignment semua user di satu project
    public function assignmentsByProject(Request $request, string $projectId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        return response()->json(['data' => $this->service->assignmentsByProject($projectId)]);
    }
}
