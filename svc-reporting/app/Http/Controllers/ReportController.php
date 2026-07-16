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
        $this->requirePermission('report.view');
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->workloadReport($request->sprint_id)]);
    }

    public function divisionReport(Request $request): JsonResponse
    {
        $this->requirePermission('report.view');
        $request->validate(['sprint_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->divisionReport($request->sprint_id)]);
    }

    public function timeTrackingReport(Request $request): JsonResponse
    {
        $this->requirePermission('report.view');
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
        $this->requirePermission('report.view');
        return response()->json(['data' => $this->service->sprintReport($sprintId)]);
    }

    public function exportWorkload(Request $request): mixed
    {
        $this->requireRole(['administrator', 'kepala_balai', 'kepala_seksi']);
        $sprintId = $request->query('sprint_id');
        $data     = $this->service->workloadReport($sprintId ?? '');
        $sprint   = $sprintId ? "Sprint ID: {$sprintId}" : "Semua Sprint";
        $pdfService = new \App\Services\ReportPdfService();
        return $pdfService->workload($data, $sprint);
    }

    public function exportVelocity(Request $request): mixed
    {
        $this->requirePermission('report.view');
        $request->validate(['project_id' => 'required|uuid']);
        $data = $this->service->velocityReport($request->project_id);
        $pdfService = new \App\Services\ReportPdfService();
        return $pdfService->velocity($data, "Project {$request->project_id}");
    }

    public function exportTimeTracking(Request $request): mixed
    {
        $this->requirePermission('report.view');
        $request->validate([
            'project_id' => 'required|uuid',
            'from'       => 'required|date',
            'to'         => 'required|date',
        ]);
        $data = $this->service->timeTracking($request->project_id, $request->from, $request->to);
        $period = "{$request->from} s/d {$request->to}";
        $pdfService = new \App\Services\ReportPdfService();
        return $pdfService->timeTracking($data, $period);
    }

    public function exportSprint(Request $request, string $sprintId): mixed
    {
        $this->requireRole(['administrator', 'kepala_balai', 'kepala_seksi']);
        $data = $this->service->sprintReport($sprintId);
        $pdfService = new \App\Services\ReportPdfService();
        return $pdfService->sprint($data, "Sprint {$sprintId}");
    }

    public function velocityReport(Request $request): JsonResponse
    {
        $this->requirePermission('report.view');
        $request->validate(['project_id' => 'required|uuid']);
        return response()->json(['data' => $this->service->velocityReport($request->project_id)]);
    }
}
