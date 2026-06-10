<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
class ProjectServiceClient
{
    private string $baseUrl;
    public function __construct()
    {
        $this->baseUrl = rtrim(config("services.project.url", "http://svc-project"), "/");
    }
    public function getSprintTasks(string $sprintId): array
    {
        return $this->get("/api/v1/internal/sprints/{$sprintId}/tasks");
    }
    public function getSprintStories(string $sprintId): array
    {
        return $this->get("/api/v1/internal/sprints/{$sprintId}/stories");
    }
    public function getTimeLogs(string $projectId, string $from, string $to): array
    {
        return $this->get("/api/v1/internal/projects/{$projectId}/time-logs", [
            "from" => $from,
            "to"   => $to,
        ]);
    }
    public function getProjectSprints(string $projectId): array
    {
        return $this->get("/api/v1/internal/projects/{$projectId}/sprints");
    }
    private function get(string $path, array $query = []): array
    {
        try {
            $response = Http::timeout(10)->get($this->baseUrl . $path, $query);
            if ($response->successful()) return $response->json("data") ?? [];
            Log::warning("ProjectServiceClient GET failed", [
                "path" => $path, "status" => $response->status(), "body" => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::error("ProjectServiceClient exception", ["path" => $path, "error" => $e->getMessage()]);
        }
        return [];
    }
}
