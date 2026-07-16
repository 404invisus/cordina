<?php

namespace App\Console\Commands;

use App\Models\CalendarEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendCalendarDeadlineReminders extends Command
{
    protected $signature = 'calendar:remind-deadlines';
    protected $description = 'Kirim pengingat Telegram H-1 dan H-0 untuk agenda kalender';

    public function handle(): int
    {
        $today    = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();

        $this->sendFor($today, 'reminder_h0_sent_at', 0);
        $this->sendFor($tomorrow, 'reminder_h1_sent_at', 1);

        return self::SUCCESS;
    }

    private function sendFor(string $date, string $flagColumn, int $daysUntil): void
    {
        $events = CalendarEvent::where('start_date', $date)
            ->whereNull($flagColumn)
            ->with('participants')
            ->get();

        if ($events->isEmpty()) {
            $this->info("Tidak ada event untuk {$date} ({$flagColumn})");
            return;
        }

        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');

        foreach ($events as $event) {
            $recipients = collect([$event->user_id])
                ->merge($event->participants->pluck('user_id'))
                ->unique()->filter()->values();

            foreach ($recipients as $userId) {
                try {
                    Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                        'user_id' => $userId,
                        'type'    => 'calendar.deadline_reminder',
                        'payload' => [
                            'event_id'    => $event->id,
                            'event_title' => $event->title,
                            'event_type'  => $event->type,
                            'start_date'  => $event->start_date->toDateString(),
                            'start_time'  => $event->start_time,
                            'end_time'    => $event->end_time,
                            'all_day'     => $event->all_day,
                            'location'    => $event->location,
                            'days_until'  => $daysUntil,
                        ],
                    ]);
                } catch (\Throwable $e) {
                    Log::error('SendCalendarDeadlineReminders: gagal kirim', [
                        'event_id' => $event->id,
                        'user_id'  => $userId,
                        'error'    => $e->getMessage(),
                    ]);
                }
            }

            CalendarEvent::where('id', $event->id)->update([$flagColumn => now()]);
            $this->info("Reminder terkirim: {$event->title} ({$date})");
        }
    }
}
