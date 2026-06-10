<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
class AuthServiceClient
{
    private string $baseUrl;
    public function __construct()
    {
        $this->baseUrl = rtrim(config("services.auth.url"), "/");
    }
    public function getUser(string $userId): ?array
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->baseUrl}/api/v1/internal/users/{$userId}");
            if ($response->successful()) return $response->json("data");
            Log::warning("AuthServiceClient::getUser failed", ["user_id" => $userId, "status" => $response->status()]);
        } catch (\Throwable $e) {
            Log::error("AuthServiceClient::getUser exception", ["error" => $e->getMessage()]);
        }
        return null;
    }
    public function getUsers(array $userIds): array
    {
        if (empty($userIds)) return [];
        try {
            $response = Http::timeout(5)
                ->post("{$this->baseUrl}/api/v1/internal/users/batch", [
                    "ids" => array_values(array_unique($userIds)),
                ]);
            if ($response->successful()) {
                return collect($response->json("data"))->keyBy("id")->toArray();
            }
            Log::warning("AuthServiceClient::getUsers failed", ["status" => $response->status(), "body" => $response->body()]);
        } catch (\Throwable $e) {
            Log::error("AuthServiceClient::getUsers exception", ["error" => $e->getMessage()]);
        }
        return [];
    }
    public function getFullNames(array $userIds): array
    {
        return collect($this->getUsers($userIds))
            ->map(fn($u) => $u["full_name"] ?? "Unknown")
            ->toArray();
    }
}
