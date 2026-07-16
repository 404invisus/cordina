<?php

use App\Http\Controllers\WorkloadController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('/workload/summary',  [WorkloadController::class, 'summary']);
    Route::get('/workload/me',       [WorkloadController::class, 'mySummary']);
    Route::post('/workload/capacity',[WorkloadController::class, 'setCapacity']);
    Route::get('/workload/burndown', [WorkloadController::class, 'burndown']);
    Route::get('/workload/velocity', [WorkloadController::class, 'velocity']);

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
