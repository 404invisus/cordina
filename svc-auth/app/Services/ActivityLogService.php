<?php
namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ActivityLogService
{
    public static function log(
        ?string $userId,
        string $action,
        string $description,
        bool $success = true,
        array $metadata = [],
        ?Request $request = null
    ): void {
        try {
            DB::table('activity_logs')->insert([
                'id'          => (string) Str::uuid(),
                'user_id'     => $userId,
                'action'      => $action,
                'description' => $description,
                'ip_address'  => $request?->ip(),
                'user_agent'  => $request?->userAgent(),
                'metadata'    => !empty($metadata) ? json_encode($metadata) : null,
                'success'     => $success,
                'created_at'  => now(),
            ]);
        } catch (\Throwable) {}
    }
}
