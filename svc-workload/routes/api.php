<?php

use App\Http\Controllers\WorkloadController;
use App\Http\Controllers\Admin\AdminWorkloadController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('/workload/summary',  [WorkloadController::class, 'summary']);
    Route::get('/workload/me',       [WorkloadController::class, 'mySummary']);
    Route::post('/workload/capacity',[WorkloadController::class, 'setCapacity']);
    Route::get('/workload/burndown', [WorkloadController::class, 'burndown']);
    Route::get('/workload/velocity', [WorkloadController::class, 'velocity']);

    // Admin workload routes
    Route::prefix('admin/workload')->group(function () {
        Route::get('/summary',                    [AdminWorkloadController::class, 'summary']);
        Route::get('/capacity',                   [AdminWorkloadController::class, 'capacityOverview']);
        Route::post('/capacity',                  [AdminWorkloadController::class, 'setCapacity']);
        Route::get('/burndown',                   [AdminWorkloadController::class, 'burndown']);
        Route::get('/velocity',                   [AdminWorkloadController::class, 'velocity']);
        Route::get('/users/{userId}',             [AdminWorkloadController::class, 'userSummary']);
        Route::get('/users/{userId}/assignments', [AdminWorkloadController::class, 'userAssignments']);
        Route::get('/projects/{projectId}',       [AdminWorkloadController::class, 'projectWorkload']);
    });

    Route::get('/workload/calendar', function (Request $request) {
        $request->validate([
            'from'    => 'required|date',
            'to'      => 'required|date|after_or_equal:from',
            'user_id' => 'nullable|uuid',
        ]);

        $roles  = [];
        try { $roles = (array) auth()->payload()->get('roles'); } catch (\Throwable) {}

        $canViewAll = !empty(array_intersect($roles, [
            'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'
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
});

Route::prefix('v1')->middleware('internal')->group(function () {
    Route::get('/internal/calendar/all', function (Request $request) {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $events = \App\Models\CalendarEvent::withCount('participants')
            ->where(function ($q) use ($request) {
                $q->whereBetween('start_date', [$request->from, $request->to])
                  ->orWhereBetween('end_date', [$request->from, $request->to])
                  ->orWhere(function ($span) use ($request) {
                      $span->where('start_date', '<=', $request->from)
                           ->where('end_date', '>=', $request->to);
                  });
            })
            ->orderBy('start_date')
            ->get();

        $userIds = $events->pluck('user_id')->unique()->filter()->values()->toArray();
        $users   = [];
        if (!empty($userIds)) {
            try {
                $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
                $resp = \Illuminate\Support\Facades\Http::timeout(5)
                    ->post("{$authUrl}/api/v1/internal/users/batch", ['ids' => $userIds]);
                $users = collect($resp->json('data') ?? [])->keyBy('id')->toArray();
            } catch (\Throwable) {}
        }

        $result = $events->map(function ($e) use ($users) {
            return [
                'id'                => $e->id,
                'title'             => $e->title,
                'type'              => $e->type,
                'start_date'        => optional($e->start_date)->toDateString(),
                'end_date'          => optional($e->end_date)->toDateString(),
                'start_time'        => $e->start_time ? substr($e->start_time, 0, 5) : null,
                'end_time'          => $e->end_time ? substr($e->end_time, 0, 5) : null,
                'location'          => $e->location,
                'created_by_name'   => $users[$e->user_id]['full_name'] ?? null,
                'participant_count' => $e->participants_count,
            ];
        })->values();

        return response()->json(['data' => $result]);
    });
});

Route::middleware('jwt.auth')->group(function () {
    Route::prefix('v1/admin/calendar')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'destroy']);
        Route::get('/{id}/participants', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'participants']);
        Route::post('/{id}/participants', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'addParticipants']);
        Route::delete('/{id}/participants/{userId}', [\App\Http\Controllers\Admin\AdminCalendarController::class, 'removeParticipant']);
    });

    Route::get('/v1/calendar', [\App\Http\Controllers\CalendarEventController::class, 'index']);
    Route::post('/v1/calendar', [\App\Http\Controllers\CalendarEventController::class, 'store']);
    Route::get('/v1/calendar/{id}', [\App\Http\Controllers\CalendarEventController::class, 'show']);
    Route::put('/v1/calendar/{id}', [\App\Http\Controllers\CalendarEventController::class, 'update']);
    Route::delete('/v1/calendar/{id}', [\App\Http\Controllers\CalendarEventController::class, 'destroy']);
    Route::get('/v1/calendar/{id}/participants', [\App\Http\Controllers\CalendarEventController::class, 'participants']);
    Route::post('/v1/calendar/{id}/participants', [\App\Http\Controllers\CalendarEventController::class, 'addParticipants']);
    Route::delete('/v1/calendar/{id}/participants/{userId}', [\App\Http\Controllers\CalendarEventController::class, 'removeParticipant']);
});


