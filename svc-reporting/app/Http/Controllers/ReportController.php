<?php
namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $service) {}

    public function dailyBrief(Request $request): JsonResponse
    {
        return response()->json(["data" => $this->service->dailyBrief()]);
    }

    public function workloadReport(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->workloadReport($request->sprint_id)]);
    }

    public function divisionReport(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi']);
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->divisionReport($request->sprint_id)]);
    }

    public function timeTrackingReport(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $request->validate([
            'project_id' => 'required|uuid',
            'from'       => 'required|date',
            'to'         => 'required|date|after_or_equal:from',
        ]);
        return response()->json(['data' => $this->service->timeTracking(
            $request->project_id, $request->from, $request->to
        )]);
    }

    public function sprintReport(Request $request, string $sprintId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
        return response()->json(['data' => $this->service->sprintReport($sprintId)]);
    }

    public function velocityReport(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $request->validate(['project_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->velocityReport($request->project_id)]);
    }
}
