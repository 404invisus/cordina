<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
class ProjectServiceClient
{
    private string $baseUrl;
    public function __construct()
    {
        $this->baseUrl = rtrim(config("services.project.url"), "/");
    }
    public function getSprintTaskSummary(string $sprintId): array
    {
        try {
            $response = Http::timeout(10)
                ->get("{$this->baseUrl}/api/v1/internal/sprints/{$sprintId}/task-summary");
            if ($response->successful()) return $response->json("data") ?? [];
            Log::warning("getSprintTaskSummary failed", ["status" => $response->status(), "body" => $response->body()]);
        } catch (\Throwable $e) {
            Log::error("getSprintTaskSummary exception", ["error" => $e->getMessage()]);
        }
        return [];
    }
    public function getBurndown(string $sprintId): array
    {
        try {
            $response = Http::timeout(10)
                ->get("{$this->baseUrl}/api/v1/internal/sprints/{$sprintId}/burndown");
            if ($response->successful()) return $response->json("data") ?? [];
        } catch (\Throwable $e) {
            Log::error("getBurndown exception", ["error" => $e->getMessage()]);
        }
        return [];
    }
}
