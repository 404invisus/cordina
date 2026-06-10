<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\CalendarEventParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CalendarEventController extends Controller
{
    private function resolveUserNames(array $userIds): array
    {
        if (empty($userIds)) return [];
        $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        try {
            $resp  = Http::timeout(5)->post("{$authUrl}/api/v1/internal/users/batch", [
                'ids' => array_values(array_unique($userIds)),
            ]);
            return collect($resp->json('data') ?? [])->keyBy('id')->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $authId  = $this->authId();
        $roles   = $this->authRoles();
        $isAdmin = in_array('kepala_balai', $roles) || in_array('administrator', $roles);

        $query = CalendarEvent::with('participants')
            ->where(function ($date) use ($request) {
                $date->whereBetween('start_date', [$request->from, $request->to])
                     ->orWhereBetween('end_date', [$request->from, $request->to])
                     ->orWhere(function ($span) use ($request) {
                         $span->where('start_date', '<=', $request->from)
                              ->where('end_date', '>=', $request->to);
                     });
            });

        if (!$isAdmin) {
            $query->where(function ($vis) use ($authId) {
                $vis->where('visibility', 'public')
                    ->orWhere(function ($priv) use ($authId) {
                        $priv->where('visibility', 'private')
                             ->where(function ($owner) use ($authId) {
                                 $owner->where('user_id', $authId)
                                       ->orWhereHas('participants', fn($p) => $p->where('user_id', $authId));
                             });
                    });
            });
        }

        $events  = $query->orderBy('start_date')->get();
        $userIds = $events->pluck('user_id')
            ->merge($events->flatMap(fn($e) => $e->participants->pluck('user_id')))
            ->unique()->filter()->values()->toArray();
        $users   = $this->resolveUserNames($userIds);

        $result = $events->map(fn($e) => $this->formatEvent($e, $users));

        return response()->json(['data' => $result]);
    }

    public function store(Request $request): JsonResponse
    {
        $authId  = $this->authId();
        $roles   = $this->authRoles();
        $isAdmin = in_array('kepala_balai', $roles) || in_array('administrator', $roles);

        $validated = $request->validate([
            'user_id'          => 'sometimes|uuid',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'type'             => 'required|in:internal,external,cuti,lainnya',
            'visibility'       => 'required|in:public,private',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'start_time'       => 'nullable|date_format:H:i',
            'end_time'         => 'nullable|date_format:H:i',
            'all_day'          => 'boolean',
            'location'         => 'nullable|string|max:255',
            'status'           => 'sometimes|in:upcoming,ongoing,done',
            'notulensi'        => 'nullable|string',
            'hasil_pembahasan' => 'nullable|string',
            'tindak_lanjut'    => 'nullable|string',
            'attachments'      => 'nullable|array',
            'participant_ids'   => 'sometimes|array',
            'participant_ids.*' => 'uuid',
        ]);

        $targetUserId = ($isAdmin && !empty($validated['user_id']))
            ? $validated['user_id']
            : $authId;

        $event = CalendarEvent::create(array_merge($validated, [
            'user_id'    => $targetUserId,
            'created_by' => $authId,
        ]));

        if (!empty($validated['participant_ids'])) {
            $this->syncParticipants($event, $validated['participant_ids'], $authId);
            $this->notifyParticipants($event, $validated['participant_ids']);
        }

        // Pembuat otomatis jadi peserta (skip jika sudah ada di participant_ids)
        $this->syncParticipants($event, [$targetUserId], $authId);

        $this->sendNotification($event, $authId, $isAdmin);

        return response()->json(['data' => $event->load('participants')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $event   = CalendarEvent::with('participants')->findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        if ($event->visibility === 'private' && $event->user_id !== $authId && !$isAdmin) {
            $isParticipant = $event->participants->contains('user_id', $authId);
            abort_if(!$isParticipant, 403, 'Tidak punya akses');
        }

        $userIds = collect([$event->user_id])
            ->merge($event->participants->pluck('user_id'))
            ->unique()->filter()->values()->toArray();
        $users   = $this->resolveUserNames($userIds);

        return response()->json(['data' => $this->formatEvent($event, $users)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $event   = CalendarEvent::findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        abort_if($event->user_id !== $authId && !$isAdmin, 403, 'Tidak punya akses');

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'sometimes|in:internal,external,cuti,lainnya',
            'visibility'  => 'sometimes|in:public,private',
            'start_date'  => 'sometimes|date',
            'end_date'    => 'sometimes|date|after_or_equal:start_date',
            'start_time'  => 'nullable|date_format:H:i',
            'end_time'    => 'nullable|date_format:H:i',
            'all_day'     => 'boolean',
            'location'          => 'nullable|string|max:255',
            'status'            => 'sometimes|in:upcoming,ongoing,done',
            'notulensi'         => 'nullable|string',
            'hasil_pembahasan'  => 'nullable|string',
            'tindak_lanjut'     => 'nullable|string',
            'attachments'       => 'nullable|array',
        ]);

        $wasNotDone = $event->status !== 'done';
        $event->update($validated);
        if ($wasNotDone && ($validated['status'] ?? '') === 'done') {
            $this->sendDoneReport($event->fresh('participants'));
        }

        return response()->json(['data' => $event->load('participants')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $event   = CalendarEvent::findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        abort_if($event->user_id !== $authId && !$isAdmin, 403, 'Tidak punya akses');

        $event->delete();

        return response()->json(['message' => 'Kegiatan dihapus']);
    }

    /**
     * GET /v1/calendar/{id}/participants
     */
    public function participants(string $id): JsonResponse
    {
        $event   = CalendarEvent::with('participants')->findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        abort_if(
            $event->user_id !== $authId && !$isAdmin,
            403, 'Hanya pemilik event atau admin yang bisa melihat peserta'
        );

        $participantIds = $event->participants->pluck('user_id')->toArray();
        $users          = $this->resolveUserNames($participantIds);

        $result = $event->participants->map(fn($p) => [
            'id'        => $p->id,
            'user_id'   => $p->user_id,
            'full_name' => $users[$p->user_id]['full_name'] ?? null,
            'division'  => $users[$p->user_id]['division']  ?? null,
            'status'    => $p->status,
        ]);

        return response()->json(['data' => $result]);
    }

    /**
     * POST /v1/calendar/{id}/participants
     * Assign peserta — hanya pemilik event atau admin
     */
    public function addParticipants(Request $request, string $id): JsonResponse
    {
        $event   = CalendarEvent::findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        abort_if(
            $event->user_id !== $authId && !$isAdmin,
            403, 'Hanya pemilik event atau admin yang bisa menambah peserta'
        );

        $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'uuid',
        ]);

        $this->syncParticipants($event, $request->user_ids, $authId);
        $this->notifyParticipants($event, $request->user_ids);

        $users  = $this->resolveUserNames($request->user_ids);
        $result = $event->participants()->get()->map(fn($p) => [
            'id'        => $p->id,
            'user_id'   => $p->user_id,
            'full_name' => $users[$p->user_id]['full_name'] ?? null,
            'status'    => $p->status,
        ]);

        return response()->json([
            'message'      => count($request->user_ids) . ' peserta ditambahkan',
            'participants' => $result,
        ]);
    }

    /**
     * DELETE /v1/calendar/{id}/participants/{user_id}
     */
    public function removeParticipant(string $id, string $userId): JsonResponse
    {
        $event   = CalendarEvent::findOrFail($id);
        $authId  = $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());

        abort_if(
            $event->user_id !== $authId && !$isAdmin,
            403, 'Hanya pemilik event atau admin yang bisa menghapus peserta'
        );

        $deleted = CalendarEventParticipant::where('event_id', $id)
            ->where('user_id', $userId)
            ->delete();

        abort_if(!$deleted, 404, 'Peserta tidak ditemukan');

        return response()->json(null, 204);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function syncParticipants(CalendarEvent $event, array $userIds, string $assignedBy): void
    {
        $existing = $event->participants()->pluck('user_id')->toArray();
        $newIds   = array_diff($userIds, $existing);

        foreach ($newIds as $userId) {
            CalendarEventParticipant::create([
                'event_id'    => $event->id,
                'user_id'     => $userId,
                'status'      => 'invited',
                'assigned_by' => $assignedBy,
            ]);
        }
    }

    private function notifyParticipants(CalendarEvent $event, array $userIds): void
    {
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
        foreach ($userIds as $userId) {
            try {
                Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                    'user_id' => $userId,
                    'type'    => 'calendar.participant_assigned',
                    'payload' => [
                        'event_id'    => $event->id,
                        'event_title' => $event->title,
                        'event_type'  => $event->type,
                        'start_date'  => $event->start_date->toDateString(),
                        'end_date'    => $event->end_date->toDateString(),
                        'location'    => $event->location,
                    ],
                ]);
            } catch (\Throwable) {}
        }
    }

    private function formatEvent(CalendarEvent $event, array $users): array
    {
        $arr                   = $event->toArray();
        $arr['creator_name']   = $users[$event->user_id]['full_name'] ?? null;
        $arr['creator_division'] = $users[$event->user_id]['division'] ?? null;
        $arr['participants']   = $event->participants->map(fn($p) => [
            'id'        => $p->id,
            'user_id'   => $p->user_id,
            'full_name' => $users[$p->user_id]['full_name'] ?? null,
            'division'  => $users[$p->user_id]['division']  ?? null,
            'status'    => $p->status,
        ]);
        return $arr;
    }

    private function sendDoneReport(CalendarEvent $event): void
    {
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');

        $startTime = $event->start_time ? substr($event->start_time, 0, 5) . ' WIB' : null;
        $endTime   = $event->end_time   ? substr($event->end_time,   0, 5) . ' WIB' : null;
        $waktu     = $event->all_day
            ? 'Seharian'
            : ($startTime && $endTime ? "{$startTime} s.d. {$endTime}" : ($startTime ?? 'N/A'));

        $months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $tgl = $event->start_date->format('j') . ' ' . $months[(int)$event->start_date->format('n')] . ' ' . $event->start_date->format('Y');

        // Ambil nama peserta
        $participantIds = $event->participants->pluck('user_id')->toArray();
        $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $peserta  = '-';
        try {
            $resp    = Http::timeout(5)->post("{$authUrl}/api/v1/internal/users/batch", ['ids' => $participantIds]);
            $names   = collect($resp->json('data') ?? [])->pluck('full_name')->toArray();
            $peserta = implode(', ', $names) ?: '-';
        } catch (\Throwable) {}

        $lines = [];
        $lines[] = "📌 *Laporan Kegiatan*";
        $lines[] = "";
        $lines[] = "📌 Nama Kegiatan: {$event->title}";
        $lines[] = "📍 Tempat: " . ($event->location ?? '-');
        $lines[] = "🕒 Waktu: {$tgl}, {$waktu}";
        $lines[] = "👤 Peserta: {$peserta}";

        if ($event->description) {
            $lines[] = "🗒 Deskripsi Singkat: {$event->description}";
        }
        if ($event->notulensi) {
            $lines[] = "";
            $lines[] = "📝 Notulensi:";
            $lines[] = $event->notulensi;
        }
        if ($event->hasil_pembahasan) {
            $lines[] = "";
            $lines[] = "📝 Hasil Pembahasan:";
            $lines[] = $event->hasil_pembahasan;
        }
        if ($event->tindak_lanjut) {
            $lines[] = "";
            $lines[] = "📋 Tindak Lanjut:";
            $lines[] = $event->tindak_lanjut;
        }

        $message = implode("\n", $lines);

        try {
            Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                'user_id' => $event->user_id,
                'type'    => 'calendar.event_done',
                'payload' => [
                    'event_id'    => $event->id,
                    'event_title' => $event->title,
                    'message'     => $message,
                    'group_only'  => true,
                ],
            ]);
        } catch (\Throwable) {}
    }

    private function sendNotification(CalendarEvent $event, string $creatorId, bool $creatorIsAdmin): void
    {
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
        try {
            if ($event->visibility === 'public') {
                Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                    'user_id' => $event->user_id,
                    'type'    => 'calendar.event_created',
                    'payload' => [
                        'event_id'         => $event->id,
                        'event_title'      => $event->title,
                        'event_type'       => $event->type,
                        'start_date'       => $event->start_date->toDateString(),
                        'end_date'         => $event->end_date->toDateString(),
                        'visibility'       => 'public',
                        'created_by_admin' => $creatorIsAdmin,
                    ],
                ]);
            } elseif ($creatorIsAdmin) {
                Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                    'user_id' => $event->user_id,
                    'type'    => 'calendar.event_assigned',
                    'payload' => [
                        'event_id'    => $event->id,
                        'event_title' => $event->title,
                        'event_type'  => $event->type,
                        'start_date'  => $event->start_date->toDateString(),
                        'end_date'    => $event->end_date->toDateString(),
                        'visibility'  => 'private',
                    ],
                ]);
            }
        } catch (\Throwable) {}
    }
}
