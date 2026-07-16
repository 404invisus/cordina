<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\ChangeRequestController;
use App\Http\Controllers\TteConfigController;
use App\Http\Controllers\CrAttachmentController;
use App\Http\Controllers\EpicController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SprintController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Admin\AdminProjectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::middleware('jwt.auth')->group(function () {
        Route::prefix('admin')->group(function () {
            Route::get('/projects/stats',              [AdminProjectController::class, 'stats']);
            Route::get('/projects',                    [AdminProjectController::class, 'index']);
            Route::get('/projects/{id}',               [AdminProjectController::class, 'show']);
            Route::patch('/projects/{id}',             [AdminProjectController::class, 'update']);
            Route::delete('/projects/{id}',            [AdminProjectController::class, 'destroy']);
            Route::get('/projects/{id}/tasks',         [AdminProjectController::class, 'tasks']);
            Route::get('/projects/{id}/members',       [AdminProjectController::class, 'members']);
            Route::get('/tasks',                       [AdminProjectController::class, 'allTasks']);
        });

        // Change Management
        Route::get('change-requests',              [ChangeRequestController::class, 'index']);
        Route::post('change-requests',             [ChangeRequestController::class, 'store']);
        Route::get('change-requests/{id}',         [ChangeRequestController::class, 'show']);
        Route::put('change-requests/{id}',         [ChangeRequestController::class, 'update']);
        Route::delete('change-requests/{id}',      [ChangeRequestController::class, 'destroy']);
        Route::post('change-requests/{id}/submit',   [ChangeRequestController::class, 'submit']);
        Route::post('change-requests/{id}/sign',      [ChangeRequestController::class, 'sign']);
        Route::post('change-requests/{id}/implement',  [ChangeRequestController::class, 'implement']);
        Route::get('change-requests/{id}/logs',         [ChangeRequestController::class, 'logs']);

        // TTE Config (admin only)
        Route::get('tte-config',        [TteConfigController::class, 'index']);
        Route::put('tte-config',        [TteConfigController::class, 'update']);
        Route::post('tte-config/test',  [TteConfigController::class, 'test']);
        Route::get('change-requests/{id}/document',   [ChangeRequestController::class, 'downloadDocument']);
        Route::get('change-requests/{id}/attachments',                      [CrAttachmentController::class, 'index']);
        Route::post('change-requests/{id}/attachments',                     [CrAttachmentController::class, 'store']);
        Route::get('change-requests/{id}/attachments/{attachId}/download',  [CrAttachmentController::class, 'download']);
        Route::delete('change-requests/{id}/attachments/{attachId}',        [CrAttachmentController::class, 'destroy']);
        Route::post('change-requests/{id}/approve',[ChangeRequestController::class, 'approve']);
        Route::post('change-requests/{id}/reject', [ChangeRequestController::class, 'reject']);

        Route::apiResource('projects', ProjectController::class);
        Route::post('projects/{project}/members', [ProjectController::class, 'addMember']);

        Route::get('projects/{project}/sprints',                    [SprintController::class, 'index']);
        Route::post('projects/{project}/sprints',                   [SprintController::class, 'store']);
        Route::post('projects/{project}/sprints/{sprint}/start',    [SprintController::class, 'start']);
        Route::post('projects/{project}/sprints/{sprint}/complete', [SprintController::class, 'complete']);

        Route::apiResource('projects.epics', EpicController::class)->shallow();
        Route::apiResource('epics.stories',  StoryController::class)->shallow();

        Route::apiResource('tasks', TaskController::class);
        Route::post('tasks/{task}/assign',       [TaskController::class, 'assign']);
        Route::delete('tasks/{task}/assignees/{userId}', [TaskController::class, 'removeAssignee']);
        Route::post('tasks/{task}/log-time',     [TaskController::class, 'logTime']);
        Route::post('tasks/{task}/dependencies', [TaskController::class, 'addDependency']);

        Route::apiResource('tasks.comments', CommentController::class)->shallow();

        Route::get('projects/{project}/board',   [\App\Http\Controllers\BoardController::class, 'show']);
        Route::patch('tasks/{task}/move',        [\App\Http\Controllers\BoardController::class, 'move']);
        Route::get('projects/{project}/roadmap', [\App\Http\Controllers\RoadmapController::class, 'show']);

        Route::get('projects/{project}/members', function (string $projectId) {
            $members = DB::table('project_members')->where('project_id', $projectId)->get();
            if ($members->isEmpty()) return response()->json(['data' => []]);

            $userIds = $members->pluck('user_id')->toArray();
            $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');

            try {
                $resp  = \Illuminate\Support\Facades\Http::timeout(5)
                    ->post("{$authUrl}/api/v1/internal/users/batch", ['ids' => $userIds]);
                $users = collect($resp->json('data') ?? []);
            } catch (\Throwable $e) {
                $users = collect();
            }

            $result = $members->map(function ($m) use ($users) {
                $user = $users->firstWhere('id', $m->user_id);
                return array_merge((array) $m, [
                    'full_name' => $user['full_name'] ?? null,
                    'email'     => $user['email']     ?? null,
                    'division'  => $user['division']  ?? null,
                    'position'  => $user['position']  ?? null,
                ]);
            });

            return response()->json(['data' => $result]);
        });

        Route::delete('projects/{project}/members/{user}', function (string $projectId, string $userId) {
            $roles = [];
            try { $roles = (array) auth()->payload()->get('roles'); } catch (\Throwable) {}
            abort_if(
                empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'project_manager'])),
                403, 'Forbidden'
            );
            \App\Models\ProjectMember::where('project_id', $projectId)
                ->where('user_id', $userId)
                ->delete();
            return response()->json(null, 204);
        });

        Route::delete('tasks/{task}/dependencies/{dependsOn}', function (string $taskId, string $dependsOnId) {
            $roles = [];
            try { $roles = (array) auth()->payload()->get('roles'); } catch (\Throwable) {}
            abort_if(
                empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'])),
                403, 'Forbidden'
            );
            DB::table('task_dependencies')
                ->where('task_id', $taskId)
                ->where('depends_on_task_id', $dependsOnId)
                ->delete();
            return response()->json(null, 204);
        });
    });

    Route::middleware('internal')->prefix('internal')->group(function () {

        Route::get('/sprints/{sprintId}/task-summary', function (string $sprintId) {
            $data = DB::table('tasks')
                ->where('sprint_id', $sprintId)
                ->whereNull('deleted_at')
                ->select(
                    'id', 'title', 'status', 'priority', 'type',
                    'assignee_id', 'estimated_hours', 'actual_hours', 'due_date'
                )
                ->get();
            return response()->json(['data' => $data]);
        });

        Route::get('/sprints/{sprintId}/tasks', function (string $sprintId) {
            $tasks = DB::table('tasks')
                ->where('sprint_id', $sprintId)
                ->whereNull('deleted_at')
                ->select(
                    'id', 'title', 'type', 'status', 'priority', 'severity',
                    'assignee_id', 'reporter_id',
                    'estimated_hours', 'actual_hours',
                    'story_id', 'due_date', 'created_at', 'updated_at'
                )
                ->get();
            return response()->json(['data' => $tasks]);
        });

        Route::get('/sprints/{sprintId}/stories', function (string $sprintId) {
            $stories = DB::table('stories')
                ->where('sprint_id', $sprintId)
                ->select('id', 'title', 'status', 'story_points', 'assignee_id', 'epic_id')
                ->get();
            return response()->json(['data' => $stories]);
        });

        Route::get('/projects/{projectId}/time-logs', function (Request $request, string $projectId) {
            $request->validate(['from' => 'required|date', 'to' => 'required|date']);
            $logs = DB::table('time_logs as tl')
                ->join('tasks as t', 'tl.task_id', '=', 't.id')
                ->join('sprints as s', 't.sprint_id', '=', 's.id')
                ->where('s.project_id', $projectId)
                ->whereBetween('tl.logged_at', [$request->from, $request->to])
                ->select(
                    'tl.id', 'tl.task_id', 'tl.user_id',
                    'tl.logged_hours', 'tl.description', 'tl.logged_at',
                    't.title as task_title', 's.name as sprint_name'
                )
                ->get();
            return response()->json(['data' => $logs]);
        });

        Route::get('/projects/{projectId}/sprints', function (string $projectId) {
            $sprints = DB::table('sprints as s')
                ->leftJoin('tasks as t', function ($join) {
                    $join->on('t.sprint_id', '=', 's.id')->whereNull('t.deleted_at');
                })
                ->where('s.project_id', $projectId)
                ->select(
                    's.id', 's.name', 's.status', 's.start_date', 's.end_date',
                    DB::raw('SUM(COALESCE(t.estimated_hours, 0)) as total_points'),
                    DB::raw('SUM(CASE WHEN t.status = \'done\' THEN COALESCE(t.estimated_hours, 0) ELSE 0 END) as completed_points')
                )
                ->groupBy('s.id', 's.name', 's.status', 's.start_date', 's.end_date')
                ->orderBy('s.start_date')
                ->get();
            return response()->json(['data' => $sprints]);
        });

        Route::get('/sprints/{sprintId}/burndown', function (string $sprintId) {
            $sprint = DB::table('sprints')->where('id', $sprintId)->first();
            abort_if(!$sprint, 404, 'Sprint not found');

            $totalPoints = DB::table('stories')->where('sprint_id', $sprintId)->sum('story_points');

            $completedByDay = DB::table('tasks as t')
                ->join('stories as s', 't.story_id', '=', 's.id')
                ->where('s.sprint_id', $sprintId)
                ->where('t.status', 'done')
                ->whereNull('t.deleted_at')
                ->select(
                    DB::raw('DATE(t.updated_at) as date'),
                    DB::raw('SUM(s.story_points) as points_completed')
                )
                ->groupBy(DB::raw('DATE(t.updated_at)'))
                ->orderBy('date')
                ->get();

            return response()->json([
                'data' => [
                    'sprint'           => $sprint,
                    'total_points'     => (int) $totalPoints,
                    'completed_by_day' => $completedByDay,
                ],
            ]);
        });

        Route::get('/daily-stats', function () {
            $today = now()->toDateString();
            return response()->json(['data' => [
                'total_projects'   => DB::table('projects')->whereNull('deleted_at')->count(),
                'active_projects'  => DB::table('projects')->where('status', 'active')->whereNull('deleted_at')->count(),
                'tasks_due_today'  => DB::table('tasks')->whereDate('due_date', $today)->whereNull('deleted_at')->count(),
                'tasks_done_today' => DB::table('tasks')->where('status', 'done')->whereDate('updated_at', $today)->whereNull('deleted_at')->count(),
                'tasks_overdue'    => DB::table('tasks')->where('status', '!=', 'done')->where('due_date', '<', $today)->whereNull('deleted_at')->count(),
            ]]);
        });

        Route::get('/sprints/by-user', function (Request $request) {
            $request->validate([
                'user_id' => 'required|uuid',
                'from'    => 'required|date',
                'to'      => 'required|date',
            ]);

            $tasks = DB::table('tasks as t')
                ->join('sprints as s', 't.sprint_id', '=', 's.id')
                ->where('t.assignee_id', $request->user_id)
                ->whereNull('t.deleted_at')
                ->where(function ($q) use ($request) {
                    $q->whereBetween('t.due_date', [$request->from, $request->to])
                      ->orWhere(function ($q2) use ($request) {
                          $q2->whereBetween('s.start_date', [$request->from, $request->to])
                             ->orWhereBetween('s.end_date', [$request->from, $request->to]);
                      });
                })
                ->select(
                    't.id', 't.title', 't.status', 't.priority', 't.type',
                    't.due_date', 't.estimated_hours', 't.actual_hours',
                    's.id as sprint_id', 's.name as sprint_name',
                    's.start_date as sprint_start', 's.end_date as sprint_end'
                )
                ->orderBy('t.due_date')
                ->get();

            return response()->json(['data' => $tasks]);
        });
    });
});
