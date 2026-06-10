<?php

use App\Http\Controllers\WorkloadController;
use App\Http\Controllers\Admin\AdminWorkloadController;
use App\Http\Controllers\Admin\AdminCalendarController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {

    // ─── Workload (regular) ──────────────────────────────────────────────────
    Route::get('/workload/summary',   [WorkloadController::class, 'summary']);
    Route::get('/workload/me',        [WorkloadController::class, 'mySummary']);
    Route::post('/workload/capacity', [WorkloadController::class, 'setCapacity']);
    Route::get('/workload/burndown',  [WorkloadController::class, 'burndown']);
    Route::get('/workload/velocity',  [WorkloadController::class, 'velocity']);

    Route::get('/workload/calendar', function (Request $request) {
        $request->validate([
            'from'    => 'required|date',
            'to'      => 'required|date|after_or_equal:from',
            'user_id' => 'nullable|uuid',
        ]);

        $roles = [];
        try { $roles = (array) auth()->payload()->get('roles'); } catch (\Throwable) {}

        $canViewAll = !empty(array_intersect($roles, [
            'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master',
        ]));

        $targetUserId = $request->user_id ?? auth()->id();
        if (!$canViewAll && $targetUserId !== auth()->id()) {
            abort(403, 'Staff hanya bisa melihat kalender sendiri');
        }

        $projectUrl = config('services.project.url');
        $response   = \Illuminate\Support\Facades\Http::timeout(10)
            ->get("{$projectUrl}/v1/internal/sprints/by-user", [
                'user_id' => $targetUserId,
                'from'    => $request->from,
                'to'      => $request->to,
            ]);

        $capacities = \Illuminate\Support\Facades\DB::table('user_capacities')
            ->where('user_id', $targetUserId)
            ->get();

        return response()->json([
            'data' => [
                'user_id'    => $targetUserId,
                'from'       => $request->from,
                'to'         => $request->to,
                'tasks'      => $response->successful() ? $response->json('data') : [],
                'capacities' => $capacities,
            ],
        ]);
    });

    // Admin Workload
    Route::prefix('admin/workload')->group(function () {
        Route::get('/summary',                     [AdminWorkloadController::class, 'summary']);
        Route::get('/capacity',                    [AdminWorkloadController::class, 'capacityOverview']);
        Route::post('/capacity',                   [AdminWorkloadController::class, 'setCapacity']);
        Route::get('/burndown',                    [AdminWorkloadController::class, 'burndown']);
        Route::get('/velocity',                    [AdminWorkloadController::class, 'velocity']);
        Route::get('/users/{user_id}',             [AdminWorkloadController::class, 'userSummary']);
        Route::get('/users/{user_id}/assignments', [AdminWorkloadController::class, 'userAssignments']);
        Route::get('/projects/{project_id}',       [AdminWorkloadController::class, 'projectWorkload']);
    });

    // Admin Calendar
    Route::prefix('admin/calendar')->group(function () {
        Route::get('/',                                    [AdminCalendarController::class, 'index']);
        Route::post('/',                                   [AdminCalendarController::class, 'store']);
        Route::get('/{id}',                                [AdminCalendarController::class, 'show']);
        Route::put('/{id}',                                [AdminCalendarController::class, 'update']);
        Route::delete('/{id}',                             [AdminCalendarController::class, 'destroy']);
        Route::get('/{id}/participants',                   [AdminCalendarController::class, 'participants']);
        Route::post('/{id}/participants',                  [AdminCalendarController::class, 'addParticipants']);
        Route::delete('/{id}/participants/{user_id}',      [AdminCalendarController::class, 'removeParticipant']);
    });
});

// Calendar Events
Route::middleware('jwt.auth')->group(function () {
    Route::get('/v1/calendar',       [App\Http\Controllers\CalendarEventController::class, 'index']);
    Route::post('/v1/calendar',      [App\Http\Controllers\CalendarEventController::class, 'store']);
    Route::get('/v1/calendar/{id}',  [App\Http\Controllers\CalendarEventController::class, 'show']);
    Route::put('/v1/calendar/{id}',  [App\Http\Controllers\CalendarEventController::class, 'update']);
    Route::delete('/v1/calendar/{id}', [App\Http\Controllers\CalendarEventController::class, 'destroy']);

    // Participants - semua role bisa manage peserta event miliknya sendiri
    Route::get('/v1/calendar/{id}/participants',              [App\Http\Controllers\CalendarEventController::class, 'participants']);
    Route::post('/v1/calendar/{id}/participants',             [App\Http\Controllers\CalendarEventController::class, 'addParticipants']);
    Route::delete('/v1/calendar/{id}/participants/{user_id}', [App\Http\Controllers\CalendarEventController::class, 'removeParticipant']);
});
