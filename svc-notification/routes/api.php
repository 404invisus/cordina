<?php

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::middleware('internal')->post('/notifications/send', [NotificationController::class, 'send']);

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/notifications/settings',    [NotificationSettingController::class, 'index']);
        Route::put('/notifications/settings',    [NotificationSettingController::class, 'update']);
        Route::get('/notifications',             [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    });
});

// Admin: cek chat Telegram
Route::middleware('jwt.auth')->get('/v1/notifications/telegram/users', function () {
    $token = config('services.telegram.bot_token');
    $res = \Illuminate\Support\Facades\Http::get("https://api.telegram.org/bot{$token}/getUpdates");
    $updates = $res->json('result') ?? [];
    
    $users = collect($updates)
        ->filter(fn($u) => isset($u['message']['chat']['id']))
        ->map(fn($u) => [
            'chat_id'    => $u['message']['chat']['id'],
            'first_name' => $u['message']['chat']['first_name'] ?? '',
            'last_name'  => $u['message']['chat']['last_name'] ?? '',
            'username'   => $u['message']['chat']['username'] ?? null,
        ])
        ->unique('chat_id')
        ->values();
    
    return response()->json(['data' => $users]);
});
