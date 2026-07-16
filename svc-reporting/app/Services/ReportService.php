<?php

namespace App\Services;

class ReportService
{
    public function __construct(
        private readonly AuthServiceClient    $authClient,
        private readonly ProjectServiceClient $projectClient,
    ) {}

    public function dailyBrief(): array
    {
        $authStats    = $this->authClient->getStats();
        $projectStats = $this->projectClient->getDailyStats();

        return [
            "users" => [
                "total"  => $authStats["total_users"]  ?? 0,
                "active" => $authStats["active_users"] ?? 0,
            ],
            "projects" => [
                "active"    => $projectStats["active_projects"]    ?? 0,
                "total"     => $projectStats["total_projects"]     ?? 0,
            ],
            "tasks" => [
                "due_today"  => $projectStats["tasks_due_today"]   ?? 0,
                "done_today" => $projectStats["tasks_done_today"]  ?? 0,
                "overdue"    => $projectStats["tasks_overdue"]     ?? 0,
            ],
            "generated_at" => now()->toIso8601String(),
        ];
    }

    public function workloadReport(string $sprintId): array
    {
        $tasks = collect($this->projectClient->getSprintTasks($sprintId));

        if ($tasks->isEmpty()) return [];

        $grouped = $tasks->groupBy('assignee_id');

        $userIds = $grouped->keys()->filter()->values()->toArray();
        $users   = $this->authClient->getUsers($userIds);

        return $grouped->map(function ($userTasks, string $userId) use ($users) {
            $user     = $users[$userId] ?? null;
            $done     = $userTasks->where('status', 'done');
            $notDone  = $userTasks->where('status', '!=', 'done');
            $estHours = round($userTasks->sum('estimated_hours'), 2);
            $actHours = round($userTasks->sum('actual_hours'), 2);

            return [
                'user_id'        => $userId,
                'full_name'      => $user['full_name'] ?? 'Unknown',
                'division'       => $user['division']  ?? null,
                'total_tasks'    => $userTasks->count(),
                'completed'      => $done->count(),
                'pending'        => $notDone->count(),
                'estimated_hours'=> $estHours,
                'actual_hours'   => $actHours,
                'efficiency_pct' => $estHours > 0
                    ? round($actHours / $estHours * 100, 1)
                    : null,
            ];
        })->values()->toArray();
    }

    public function divisionReport(string $sprintId): array
    {
        $tasks = collect($this->projectClient->getSprintTasks($sprintId));
        if ($tasks->isEmpty()) return [];

        $userIds   = $tasks->pluck('assignee_id')->filter()->unique()->values()->toArray();
        $users     = $this->authClient->getUsers($userIds);

        $withDivision = $tasks->map(function ($task) use ($users) {
            $user = $users[$task['assignee_id'] ?? ''] ?? null;
            return array_merge((array) $task, [
                'division' => $user['division'] ?? 'Tidak Diketahui',
            ]);
        });

        return $withDivision
            ->groupBy('division')
            ->map(function ($divTasks, string $division) {
                return [
                    'division'        => $division,
                    'total_tasks'     => $divTasks->count(),
                    'completed'       => $divTasks->where('status', 'done')->count(),
                    'estimated_hours' => round($divTasks->sum('estimated_hours'), 2),
                    'actual_hours'    => round($divTasks->sum('actual_hours'), 2),
                    'member_count'    => $divTasks->pluck('assignee_id')->unique()->count(),
                ];
            })
            ->values()
            ->toArray();
    }

    public function timeTracking(string $projectId, string $from, string $to): array
    {
        $logs = collect($this->projectClient->getTimeLogs($projectId, $from, $to));
        if ($logs->isEmpty()) return [];

        $userIds = $logs->pluck('user_id')->filter()->unique()->values()->toArray();
        $users   = $this->authClient->getUsers($userIds);

        return $logs->groupBy('user_id')
            ->map(function ($userLogs, string $userId) use ($users) {
                $user = $users[$userId] ?? null;
                return [
                    'user_id'      => $userId,
                    'full_name'    => $user['full_name'] ?? 'Unknown',
                    'division'     => $user['division']  ?? null,
                    'total_logged' => round($userLogs->sum('logged_hours'), 2),
                    'task_count'   => $userLogs->pluck('task_id')->unique()->count(),
                    'logs'         => $userLogs->map(fn($l) => [
                        'task_id'      => $l['task_id'],
                        'task_title'   => $l['task_title'],
                        'sprint_name'  => $l['sprint_name'],
                        'logged_hours' => $l['logged_hours'],
                        'logged_at'    => $l['logged_at'],
                        'description'  => $l['description'],
                    ])->values()->toArray(),
                ];
            })
            ->values()
            ->toArray();
    }


    public function sprintReport(string $sprintId): array
    {
        $tasks   = collect($this->projectClient->getSprintTasks($sprintId));
        $stories = collect($this->projectClient->getSprintStories($sprintId));

        $totalPoints  = $stories->sum('story_points');
        $donePoints   = $stories->where('status', 'done')->sum('story_points');
        $totalTasks   = $tasks->count();
        $doneTasks    = $tasks->where('status', 'done')->count();

        $byType   = $tasks->groupBy('type')
            ->map(fn($t) => ['total' => $t->count(), 'done' => $t->where('status', 'done')->count()])
            ->toArray();

        $byStatus = $tasks->groupBy('status')
            ->map->count()
            ->toArray();

        return [
            'sprint_id'         => $sprintId,
            'total_points'      => (int) $totalPoints,
            'completed_points'  => (int) $donePoints,
            'completion_rate'   => $totalPoints > 0
                ? round($donePoints / $totalPoints * 100, 1)
                : 0,
            'total_tasks'       => $totalTasks,
            'done_tasks'        => $doneTasks,
            'task_completion'   => $totalTasks > 0
                ? round($doneTasks / $totalTasks * 100, 1)
                : 0,
            'by_type'           => $byType,
            'by_status'         => $byStatus,
        ];
    }


    public function velocityReport(string $projectId): array
    {
        $sprints = collect($this->projectClient->getProjectSprints($projectId));

        return $sprints->map(fn($s) => [
            'sprint_id'         => $s['id'],
            'sprint_name'       => $s['name'],
            'status'            => $s['status'],
            'start_date'        => $s['start_date'],
            'end_date'          => $s['end_date'],
            'total_points'      => (int) ($s['total_points'] ?? 0),
            'completed_points'  => (int) ($s['completed_points'] ?? 0),
            'velocity'          => (int) ($s['completed_points'] ?? 0),
        ])->toArray();
    }

    // ── Admin report data ───────────────────────────────────────────────────────

    public function adminUsers(): array
    {
        try {
            $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
            $response = \Illuminate\Support\Facades\Http::timeout(10)
                ->get("{$authUrl}/api/v1/internal/users/all");
            return $response->successful() ? ($response->json('data') ?? []) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function adminProjects(): array
    {
        try {
            $projectUrl = rtrim(config('services.project.url', 'http://svc-project'), '/');
            $response   = \Illuminate\Support\Facades\Http::timeout(10)
                ->get("{$projectUrl}/api/v1/internal/projects/all");
            return $response->successful() ? ($response->json('data') ?? []) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function adminCalendar(string $from, string $to): array
    {
        try {
            $workloadUrl = rtrim(config('services.workload.url', 'http://svc-workload'), '/');
            $response    = \Illuminate\Support\Facades\Http::timeout(10)
                ->get("{$workloadUrl}/api/v1/internal/calendar/all", compact('from', 'to'));
            return $response->successful() ? ($response->json('data') ?? []) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function adminWorkload(string $projectId, ?string $sprintId): array
    {
        try {
            $projectUrl = rtrim(config('services.project.url', 'http://svc-project'), '/');
            $params     = ['project_id' => $projectId];
            if ($sprintId) $params['sprint_id'] = $sprintId;
            $response   = \Illuminate\Support\Facades\Http::timeout(10)
                ->get("{$projectUrl}/api/v1/internal/workload/summary", $params);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }
}
