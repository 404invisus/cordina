<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class TteConfigService
{
    public static function get(string $key, string $default = ''): string
    {
        return Cache::remember("tte_config_{$key}", 60, function () use ($key, $default) {
            $row = DB::table('tte_configs')->where('key', $key)->first();
            return $row?->value ?? $default;
        });
    }

    public static function all(): array
    {
        return Cache::remember('tte_config_all', 60, function () {
            return DB::table('tte_configs')->pluck('value', 'key')->toArray();
        });
    }

    public static function set(string $key, string $value): void
    {
        DB::table('tte_configs')->updateOrInsert(
            ['key' => $key],
            ['value' => $value, 'updated_at' => now()]
        );
        Cache::forget("tte_config_{$key}");
        Cache::forget('tte_config_all');
    }
}
