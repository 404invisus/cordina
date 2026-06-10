<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WorkloadService
{
    public function __construct(
        private readonly AuthServiceClient    $authClient,
        private readonly ProjectServiceClient $projectClient,
    ) {}

    public function summary(string $sprintId): array
    {
        $capacities = DB::table('user_capacities')
            ->where('sprint_id', $sprintId)
            ->get()
            ->keyBy('user_id');

        $tasks = collect($this->projectClient->getSprintTaskSummary($sprintId));
        $tasksByUser = $tasks->groupBy('assignee_id');

        $allUserIds = $capacities->keys()
            ->merge($tasksByUser->keys())
            ->unique()->filter()->values()->toArray();

        $users = $this->authClient->getUsers($allUserIds);

        return collect($allUserIds)->map(function (string $userId) use ($capacities, $tasksByUser, $users) {
            $cap       = $capacities->get($userId);
            $userTasks = $tasksByUser->get($userId, collect());
            $user      = $users[$userId] ?? null;

            return [
                'user_id'         => $userId,
                'full_name'       => $user['full_name'] ?? 'Unknown',
                'division'        => $user['division']  ?? null,
                'available_hours' => $cap?->available_hours ?? 0,
                'allocated_hours' => $cap?->allocated_hours ?? 0,
                'task_count'      => $userTasks->count(),
                'done_count'      => $userTasks->where('status', 'done')->count(),
                'estimated_hours' => round($userTasks->sum('estimated_hours'), 2),
                'actual_hours'    => round($userTasks->sum('actual_hours'), 2),
            ];
        })->values()->toArray();
    }

    public function userSummary(string $userId, string $sprintId): array
    {
        $capacity = DB::table('user_capacities')
            ->where('user_id', $userId)
            ->where('sprint_id', $sprintId)
            ->first();

        $allTasks = collect($this->projectClient->getSprintTaskSummary($sprintId));
        $myTasks  = $allTasks->where('assignee_id', $userId)->values();

        return [
            'user_id'         => $userId,
            'sprint_id'       => $sprintId,
            'available_hours' => $capacity?->available_hours ?? 0,
            'allocated_hours' => $capacity?->allocated_hours ?? 0,
            'task_count'      => $myTasks->count(),
            'done_count'      => $myTasks->where('status', 'done')->count(),
            'tasks'           => $myTasks->toArray(),
        ];
    }

    public function setCapacity(array $data): object
    {
        DB::table('user_capacities')->updateOrInsert(
            ['sprint_id' => $data['sprint_id'], 'user_id' => $data['user_id']],
            [
                'available_hours' => $data['available_hours'],
                'allocated_hours' => $data['allocated_hours'] ?? 0,
                'updated_at'      => now(),
                'created_at'      => now(),
            ]
        );

        return (object) DB::table('user_capacities')
            ->where('sprint_id', $data['sprint_id'])
            ->where('user_id', $data['user_id'])
            ->first();
    }

    public function burndown(string $sprintId): array
    {
        return $this->projectClient->getBurndown($sprintId);
    }

    public function velocity(string $projectId): array
    {
        try {
            $response = Http::timeout(10)->get(
                rtrim(config('services.project.url'), '/') . "/api/v1/internal/projects/{$projectId}/sprints"
            );
            if ($response->successful()) return $response->json('data') ?? [];
        } catch (\Throwable $e) {
            Log::error("velocity fetch failed", ['error' => $e->getMessage()]);
        }
        return [];
    }

    public function calendar(string $userId, string $from, string $to): array
    {
        $projectUrl = config('services.project.url');
        $response   = Http::timeout(10)->get("{$projectUrl}/v1/internal/sprints/by-user", [
            'user_id' => $userId,
            'from'    => $from,
            'to'      => $to,
        ]);

        $capacities = DB::table('user_capacities')->where('user_id', $userId)->get();

        return [
            'user_id'    => $userId,
            'from'       => $from,
            'to'         => $to,
            'tasks'      => $response->successful() ? $response->json('data') : [],
            'capacities' => $capacities,
        ];
    }

    // Semua task user di semua project (lintas sprint & project)
    public function assignmentsByUser(string $userId): array
    {
        try {
            $projectUrl = config('services.project.url');
            $response   = Http::timeout(10)->get(
                "{$projectUrl}/v1/internal/assignments/user/{$userId}"
            );

            if ($response->successful()) {
                $tasks = collect($response->json('data') ?? []);

                // Group by project
                $byProject = $tasks->groupBy('project_id')->map(function ($projectTasks, $projectId) {
                    return [
                        'project_id'   => $projectId,
                        'project_name' => $projectTasks->first()['project_name'] ?? null,
                        'task_count'   => $projectTasks->count(),
                        'done_count'   => $projectTasks->where('status', 'done')->count(),
                        'in_progress'  => $projectTasks->where('status', 'in_progress')->count(),
                        'todo_count'   => $projectTasks->where('status', 'todo')->count(),
                        'total_estimated_hours' => round($projectTasks->sum('estimated_hours'), 2),
                        'total_actual_hours'    => round($projectTasks->sum('actual_hours'), 2),
                        'tasks'        => $projectTasks->values()->toArray(),
                    ];
                })->values();

                return [
                    'user_id'       => $userId,
                    'total_tasks'   => $tasks->count(),
                    'total_done'    => $tasks->where('status', 'done')->count(),
                    'by_project'    => $byProject,
                ];
            }
        } catch (\Throwable $e) {
            Log::error("assignmentsByUser failed", ['error' => $e->getMessage()]);
        }

        return ['user_id' => $userId, 'total_tasks' => 0, 'by_project' => []];
    }

    // Distribusi assignment semua user di satu project
    public function assignmentsByProject(string $projectId): array
    {
        try {
            $projectUrl = config('services.project.url');
            $response   = Http::timeout(10)->get(
                "{$projectUrl}/v1/internal/assignments/project/{$projectId}"
            );

            if ($response->successful()) {
                $tasks = collect($response->json('data') ?? []);

                // Group by assignee
                $byUser = $tasks->groupBy('assignee_id')->map(function ($userTasks, $userId) {
                    return [
                        'user_id'               => $userId,
                        'full_name'             => $userTasks->first()['assignee_name'] ?? 'Unassigned',
                        'task_count'            => $userTasks->count(),
                        'done_count'            => $userTasks->where('status', 'done')->count(),
                        'in_progress'           => $userTasks->where('status', 'in_progress')->count(),
                        'todo_count'            => $userTasks->where('status', 'todo')->count(),
                        'total_estimated_hours' => round($userTasks->sum('estimated_hours'), 2),
                        'total_actual_hours'    => round($userTasks->sum('actual_hours'), 2),
                    ];
                })->values();

                // Pisahkan unassigned
                $unassigned = $tasks->whereNull('assignee_id');

                return [
                    'project_id'      => $projectId,
                    'total_tasks'     => $tasks->count(),
                    'unassigned_count'=> $unassigned->count(),
                    'by_user'         => $byUser,
                ];
            }
        } catch (\Throwable $e) {
            Log::error("assignmentsByProject failed", ['error' => $e->getMessage()]);
        }

        return ['project_id' => $projectId, 'total_tasks' => 0, 'by_user' => []];
    }
}
