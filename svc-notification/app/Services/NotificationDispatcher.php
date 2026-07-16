<?php
namespace App\Services;
use App\Jobs\SendTelegramNotification;
use App\Models\Notification;
use App\Models\UserNotificationSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
class NotificationDispatcher
{
    private string $authUrl;
    private string $groupChatId;
    public function __construct()
    {
        $this->authUrl = rtrim(config('services.auth.url'), '/');
        $this->groupChatId = config('services.telegram.group_chat_id', '-5236090219');
    }
    public function dispatch(string $userId, string $type, array $payload): void
    {
        $user     = $this->resolveUser($userId);
        $userName = $user['full_name'] ?? 'Unknown';
        $chatId   = $user['telegram_chat_id'] ?? null;
        $message  = $this->buildMessage($type, $payload, $userName);
        $channels = $this->getEnabledChannels($userId, $type);
        foreach ($channels as $channel) {
            $notif = Notification::create([
                'user_id' => $userId,
                'type'    => $type,
                'payload' => array_merge($payload, [
                    'resolved_name' => $userName,
                    'message'       => $message,
                ]),
                'channel' => $channel,
                'status'  => 'pending',
            ]);
            match ($channel) {
                'telegram' => $this->dispatchTelegram(
                    $notif->id, $userId, $chatId, $message,
                    groupOnly: (in_array($type, ['calendar.event_created']) && ($payload['visibility'] ?? '') === 'public') || $type === 'calendar.event_done',
                    privateOnly: in_array($type, ['calendar.event_assigned', 'change_request.submitted', 'change_request.review_request', 'change_request.approved', 'change_request.rejected']) || (in_array($type, ['calendar.event_created']) && ($payload['visibility'] ?? '') === 'private'),
                ),
                'in_app'   => $this->dispatchInApp($notif->id),
                default    => Log::info("Channel {$channel} not implemented yet"),
            };
        }
    }
    private function dispatchTelegram(string $notifId, string $userId, ?string $chatId, string $message, bool $groupOnly = false, bool $privateOnly = false): void
    {
        if ($privateOnly) {
            if ($chatId) {
                SendTelegramNotification::dispatch($notifId, $userId, $chatId, $message);
            }
            return;
        }
        if ($groupOnly) {
            SendTelegramNotification::dispatch($notifId, $userId, $this->groupChatId, $message);
            return;
        }
        if ($chatId) {
            SendTelegramNotification::dispatch($notifId, $userId, $chatId, $message);
        }
        SendTelegramNotification::dispatch($notifId, $userId, $this->groupChatId, $message);
    }
    private function dispatchInApp(string $notifId): void
    {
        Notification::where('id', $notifId)->update(['status' => 'sent']);
    }
    private function resolveUser(string $userId): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->authUrl}/api/v1/internal/users/{$userId}");
            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
            Log::warning("NotificationDispatcher: user resolve failed", ['user_id' => $userId, 'status' => $response->status()]);
        } catch (\Throwable $e) {
            Log::error("NotificationDispatcher: user resolve exception", ['user_id' => $userId, 'error' => $e->getMessage()]);
        }
        return [];
    }
    private function buildMessage(string $type, array $payload, string $userName): string
    {
        return match ($type) {
            'task.assigned'       => sprintf("*[task.assigned]* Task \"%s\" di-assign ke *%s*", $payload['task_title'] ?? 'N/A', $userName),
            'task.commented'      => sprintf("*[komentar baru]* %s menambahkan komentar pada task \"%s\"", $userName, $payload['task_title'] ?? 'N/A'),
            'task.status_changed' => sprintf("*[status berubah]* Task \"%s\" diubah ke *%s* oleh %s", $payload['task_title'] ?? 'N/A', $payload['new_status'] ?? 'N/A', $userName),
            'sprint.started'      => sprintf("*[sprint dimulai]* Sprint \"%s\" telah dimulai", $payload['sprint_name'] ?? 'N/A'),
            'sprint.completed'    => sprintf("*[sprint selesai]* Sprint \"%s\" telah selesai", $payload['sprint_name'] ?? 'N/A'),
            'calendar.event_created'  => (function() use ($payload) {
                $type = match($payload['event_type'] ?? '') {
                    'internal' => 'Internal Kantor',
                    'external' => 'External Kantor',
                    'cuti'     => 'Cuti',
                    default    => 'Lainnya',
                };
                try {
                    $dt = new \DateTime($payload['start_date'] ?? 'now');
                    $days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
                    $months = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                    $dateStr = $days[(int)$dt->format('w')] . ', ' . $dt->format('j') . ' ' . $months[(int)$dt->format('n')] . ' ' . $dt->format('Y');
                } catch (\Throwable) { $dateStr = $payload['start_date'] ?? '-'; }
                $waktu = ($payload['all_day'] ?? false) ? 'Seharian' : (($payload['start_time'] ?? '') ? substr($payload['start_time'],0,5).' WIB s.d '.(($payload['end_time'] ?? '') ? substr($payload['end_time'],0,5).' WIB' : 'Selesai') : 'Seharian');
                return "*AGENDA KEGIATAN*
".$dateStr."

📋 Nama: *".($payload['event_title'] ?? 'N/A')."*
📌 Jenis: ".$type."
🕙 Waktu: ".$waktu."
🏛 Tempat: ".($payload['location'] ?? '-')."
👥 Peserta: ".($payload['participants'] ?? '-');
            })(),
            'calendar.event_assigned' => (function() use ($payload) {
                $type = match($payload['event_type'] ?? '') {
                    'internal' => 'Internal Kantor',
                    'external' => 'External Kantor',
                    'cuti'     => 'Cuti',
                    default    => 'Lainnya',
                };
                try {
                    $dt = new \DateTime($payload['start_date'] ?? 'now');
                    $days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
                    $months = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                    $dateStr = $days[(int)$dt->format('w')] . ', ' . $dt->format('j') . ' ' . $months[(int)$dt->format('n')] . ' ' . $dt->format('Y');
                } catch (\Throwable) { $dateStr = $payload['start_date'] ?? '-'; }
                $waktu = ($payload['all_day'] ?? false) ? 'Seharian' : (($payload['start_time'] ?? '') ? substr($payload['start_time'],0,5).' WIB s.d '.(($payload['end_time'] ?? '') ? substr($payload['end_time'],0,5).' WIB' : 'Selesai') : 'Seharian');
                return "*ANDA DIJADWALKAN UNTUK MENGIKUTI AGENDA KEGIATAN*
".$dateStr."

📋 Nama: *".($payload['event_title'] ?? 'N/A')."*
📌 Jenis: ".$type."
🕙 Waktu: ".$waktu."
🏛 Tempat: ".($payload['location'] ?? '-')."
👥 Peserta: ".($payload['participants'] ?? '-');
            })(),
            'task.mentioned' => sprintf(
                "*[mention]* %s menyebut Anda dalam task *\"%s\"*\nKomentar: \"%s\"",
                $payload['mentioned_by'] ?? $userName,
                $payload['task_title']   ?? 'N/A',
                $payload['comment']      ?? ''
            ),
            'calendar.event_done' => $payload['message'] ?? sprintf("*[kegiatan selesai]* %s", $payload['event_title'] ?? 'N/A'),
            'change_request.submitted' => sprintf(
                "*[change request]* %s mengajukan CR baru: *\"%s\"*\nPrioritas: %s | Tipe: %s\n\nAnda ditunjuk sebagai penilai pertama. Segera tinjau di aplikasi ConnectOne.",
                $userName,
                $payload['cr_title'] ?? 'N/A',
                strtoupper($payload['cr_priority'] ?? 'medium'),
                ucfirst($payload['cr_type'] ?? 'normal')
            ),
            'change_request.review_request' => sprintf(
                "*[change request]* Giliran Anda meninjau CR: *\"%s\"*\nPrioritas: %s | Tipe: %s\n\nPenilai sebelumnya telah menyetujui. Segera tinjau di aplikasi ConnectOne.",
                $payload['cr_title'] ?? 'N/A',
                strtoupper($payload['cr_priority'] ?? 'medium'),
                ucfirst($payload['cr_type'] ?? 'normal')
            ),
            'change_request.approved' => sprintf(
                "*[change request disetujui]* CR *\"%s\"* telah disetujui.%s",
                $payload['cr_title'] ?? 'N/A',
                !empty($payload['reviewer_note']) ? "\nCatatan: " . $payload['reviewer_note'] : ''
            ),
            'change_request.implemented' => sprintf(
                "*[change request diimplementasikan]* CR *"%s"* telah diimplementasikan.",
                $payload['cr_title'] ?? 'N/A'
            ),
            'change_request.rejected' => sprintf(
                "*[change request ditolak]* CR *\"%s\"* ditolak.\nCatatan: %s",
                $payload['cr_title'] ?? 'N/A',
                $payload['reviewer_note'] ?? '-'
            ),
            default => sprintf("*[notifikasi]* %s", $payload['message'] ?? $type),
        };
    }
    private function getEnabledChannels(string $userId, string $type): array
    {
        $settings = UserNotificationSetting::where('user_id', $userId)
            ->where('event_type', $type)
            ->where('enabled', true)
            ->pluck('channel')
            ->toArray();
        return empty($settings) ? ['telegram', 'in_app'] : $settings;
    }
}
