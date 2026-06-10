<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendTelegramNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 15;

    public function __construct(
        private readonly string  $notificationId,
        private readonly string  $userId,
        private readonly ?string $chatId,
        private readonly string  $message,
    ) {}

    public function handle(): void
    {
        $notif = Notification::findOrFail($this->notificationId);

        if (!$this->chatId) {
            Log::warning("SendTelegramNotification: no chatId for user", [
                'user_id'         => $this->userId,
                'notification_id' => $this->notificationId,
            ]);
            $notif->update(['status' => 'failed', 'error_message' => 'telegram_chat_id not set for this user']);
            return;
        }

        $token    = config('services.telegram.bot_token');
        $response = Http::timeout(10)->post(
            "https://api.telegram.org/bot{$token}/sendMessage",
            [
                'chat_id'    => $this->chatId,
                'text'       => $this->message,
                'parse_mode' => 'Markdown',
            ]
        );

        if ($response->successful()) {
            $notif->update(['status' => 'sent', 'sent_at' => now()]);

            Log::info("Telegram sent", [
                'user_id'    => $this->userId,
                'chat_id'    => $this->chatId,
                'message'    => $this->message,
            ]);
        } else {
            Log::error("Telegram sendMessage failed", [
                'user_id'  => $this->userId,
                'chat_id'  => $this->chatId,
                'status'   => $response->status(),
                'response' => $response->body(),
            ]);

            $notif->update([
                'status'        => 'failed',
                'error_message' => $response->body(),
            ]);

            throw new \RuntimeException("Telegram API error: " . $response->status());
        }
    }

    public function failed(\Throwable $exception): void
    {
        Notification::where('id', $this->notificationId)
            ->update([
                'status'        => 'failed',
                'error_message' => 'Max retries exceeded: ' . $exception->getMessage(),
            ]);
    }
}
