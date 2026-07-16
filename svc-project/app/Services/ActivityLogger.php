<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class ActivityLogger
{
    public static function log(string $userId, string $action, string $description, bool $success = true, array $metadata = []): void
    {
        try {
            $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
            Http::timeout(3)->post("{$authUrl}/api/v1/internal/activity-log", [
                'user_id'     => $userId,
                'action'      => $action,
                'description' => $description,
                'success'     => $success,
                'metadata'    => $metadata,
            ]);
        } catch (\Throwable) {}
    }
}
