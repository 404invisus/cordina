<?php
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('/reports/daily-brief', [ReportController::class, 'dailyBrief']);
    Route::get('/reports/workload',   [ReportController::class, 'workloadReport']);
    Route::get('/reports/division',   [ReportController::class, 'divisionReport']);
    Route::get('/reports/time',       [ReportController::class, 'timeTrackingReport']);
    Route::get('/reports/sprint/{id}',[ReportController::class, 'sprintReport']);
    Route::get('/reports/velocity', [ReportController::class, 'velocityReport']);
    Route::get('/reports/export/workload',        [ReportController::class, 'exportWorkload']);
    Route::get('/reports/export/sprint/{id}',     [ReportController::class, 'exportSprint']);
    Route::get('/reports/export/velocity',         [ReportController::class, 'exportVelocity']);
    Route::get('/reports/export/time-tracking',    [ReportController::class, 'exportTimeTracking']);

    Route::get('/admin/reports/export/users',    [ReportController::class, 'adminExportUsers']);
    Route::get('/admin/reports/export/projects', [ReportController::class, 'adminExportProjects']);
    Route::get('/admin/reports/export/calendar', [ReportController::class, 'adminExportCalendar']);
    Route::get('/admin/reports/export/workload', [ReportController::class, 'adminExportWorkload']);
});
