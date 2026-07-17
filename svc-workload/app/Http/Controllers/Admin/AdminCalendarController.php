<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\CalendarEventParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AdminCalendarController extends Controller
{
    /**
     * Resolve user names dari svc-auth
     */
    private function resolveUserNames(array $userIds): array
    {
        if (empty($userIds)) return [];
        $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        try {
            $resp  = Http::timeout(5)->post("{$authUrl}/api/v1/internal/users/batch", [
                'ids' => array_values(array_unique($userIds)),
            ]);
            return collect($resp->json('data') ?? [])->keyBy('id')->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * GET /v1/admin/calendar
     * Semua event (termasuk private) dengan peserta
     */
    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $request->validate([
            'from'    => 'required|date',
            'to'      => 'required|date|after_or_equal:from',
            'user_id' => 'sometimes|uuid',
            'type'    => 'sometimes|in:internal,external,cuti,lainnya',
        ]);

        $events = CalendarEvent::with('participants')
            ->where(function ($q) use ($request) {
                $q->whereBetween('start_date', [$request->from, $request->to])
                  ->orWhereBetween('end_date', [$request->from, $request->to])
                  ->orWhere(function ($span) use ($request) {
                      $span->where('start_date', '<=', $request->from)
                           ->where('end_date', '>=', $request->to);
                  });
            })
            ->when($request->user_id, function ($q, $userId) {
                $q->where(function ($q2) use ($userId) {
                    $q2->where('user_id', $userId)
                       ->orWhereHas('participants', fn($p) => $p->where('user_id', $userId));
                });
            })
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->orderBy('start_date')
            ->get();

        // Kumpulkan semua user_id (creator + participants)
        $allUserIds = $events->pluck('user_id')
            ->merge($events->flatMap(fn($e) => $e->participants->pluck('user_id')))
            ->unique()->filter()->values()->toArray();

        $users = $this->resolveUserNames($allUserIds);

        $result = $events->map(function ($event) use ($users) {
            $arr = $event->toArray();
            $arr['creator_name']     = $users[$event->user_id]['full_name'] ?? null;
            $arr['creator_division'] = $users[$event->user_id]['division']  ?? null;
            $arr['participants']     = $event->participants->map(function ($p) use ($users) {
                if ($p->group_id) {
                    return ['id' => $p->id, 'group_id' => $p->group_id, 'group_name' => $p->group_name, 'full_name' => $p->group_name, 'is_group' => true, 'status' => $p->status];
                }
                return [
                    'id'        => $p->id,
                    'user_id'   => $p->user_id,
                    'full_name' => $users[$p->user_id]['full_name'] ?? null,
                    'division'  => $users[$p->user_id]['division']  ?? null,
                    'status'    => $p->status,
                ];
            });
            return $arr;
        });

        return response()->json(['data' => $result]);
    }

    /**
     * POST /v1/admin/calendar
     * Buat event baru (bisa untuk user lain)
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $validated = $request->validate([
            'user_id'      => 'sometimes|uuid',
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'type'         => 'required|in:internal,external,cuti,lainnya',
            'visibility'   => 'required|in:public,private',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after_or_equal:start_date',
            'start_time'   => 'nullable|date_format:H:i',
            'end_time'     => 'nullable|date_format:H:i',
            'all_day'      => 'boolean',
            'location'     => 'nullable|string|max:255',
            'participant_ids'   => 'sometimes|array',
            'participant_ids.*' => 'uuid',
        ]);

        $event = CalendarEvent::create([
            'user_id'     => $validated['user_id'] ?? $this->authId(),
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type'        => $validated['type'],
            'visibility'  => $validated['visibility'],
            'start_date'  => $validated['start_date'],
            'end_date'    => $validated['end_date'],
            'start_time'  => $validated['start_time'] ?? null,
            'end_time'    => $validated['end_time'] ?? null,
            'all_day'     => $validated['all_day'] ?? true,
            'location'    => $validated['location'] ?? null,
            'created_by'  => $this->authId(),
        ]);


        // Assign participants jika ada
        if (!empty($validated['participant_ids'])) {
            $this->syncParticipants($event, $validated['participant_ids']);
            $this->notifyParticipants($event, $validated['participant_ids']);
        }

        \Illuminate\Support\Facades\Log::info('CALENDAR_DEBUG', ['group_ids_validated' => $request->input('group_ids') ?? 'TIDAK ADA', 'group_ids_raw' => $request->input('group_ids') ?? 'TIDAK ADA', 'all_input' => array_keys($request->all())]);
        // Group participants
        $groupIds = $request->input('group_ids', []);
        \Illuminate\Support\Facades\Log::info('GROUP_IDS_CHECK', ['groupIds' => $groupIds, 'count' => count($groupIds)]);
        if (!empty($groupIds)) {
            $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
            $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
            foreach ($groupIds as $groupId) {
                try {
                    $groupResp = Http::timeout(5)->get("{$authUrl}/api/v1/internal/user-groups/{$groupId}");
                    \Illuminate\Support\Facades\Log::info('GROUP_RESP', ['status' => $groupResp->status(), 'ok' => $groupResp->successful(), 'data_keys' => array_keys($groupResp->json('data') ?? [])]);
                    if (!$groupResp->successful()) continue;
                    \Illuminate\Support\Facades\Log::info('GROUP_AFTER_CONTINUE', ['groupId' => $groupId]);
                    $group     = $groupResp->json('data');
                    $groupName = $group['name'] ?? 'Group';
                    \Illuminate\Support\Facades\Log::info('GROUP_DATA', ['group' => $group, 'groupName' => $groupName, 'event_id' => $event->id]);
                    \Illuminate\Support\Facades\DB::table('calendar_event_participants')->insertOrIgnore([
                        'id'          => (string) \Illuminate\Support\Str::uuid(),
                        'event_id'    => $event->id,
                        'user_id'     => null,
                        'group_id'    => $groupId,
                        'group_name'  => $groupName,
                        'assigned_by' => $this->authId(),
                        'status'      => 'invited',
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                    \Illuminate\Support\Facades\Log::info('GROUP_INSERT', ['event_id' => $event->id, 'group_id' => $groupId, 'group_name' => $groupName]);
                    Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send-group", [
                        'group_name' => $groupName,
                        'type'       => 'calendar.event_created',
                        'payload'    => [
                            'event_title' => $event->title,
                            'event_type'  => $event->type,
                            'start_date'  => $event->start_date?->toDateString(),
                            'start_time'  => $event->start_time,
                            'end_time'    => $event->end_time,
                            'all_day'     => $event->all_day,
                            'location'    => $event->location,
                            'participants' => $groupName,
                        ],
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('GROUP_ERROR', ['msg' => $e->getMessage(), 'line' => $e->getLine()]);
                }
            }
        }

        // Target user otomatis jadi peserta (bukan admin pembuatnya)
        // Kecuali admin buat untuk dirinya sendiri
        $targetUserId = $validated['user_id'] ?? $this->authId();
        $isAdmin = in_array('kepala_balai', $this->authRoles()) || in_array('administrator', $this->authRoles());
        if (!$isAdmin) {
            $this->syncParticipants($event, [$targetUserId]);
        }
        $targetUserId = $validated['user_id'] ?? $this->authId();
        $adminRoles = ['kepala_balai', 'administrator'];
        if (!$isAdmin) {
            $this->syncParticipants($event, [$targetUserId]);
        }

        // Notifikasi event created ke semua user
        try {
            $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
            Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                'user_id' => $event->user_id,
                'type'    => 'calendar.event_created',
                'payload' => [
                    'event_id'       => $event->id,
                    'event_title'    => $event->title,
                    'event_type'     => $event->type,
                    'start_date'     => $event->start_date->toDateString(),
                    'end_date'       => $event->end_date->toDateString(),
                    'start_time'     => $event->start_time,
                    'end_time'       => $event->end_time,
                    'all_day'        => $event->all_day,
                    'location'       => $event->location,
                    'visibility'     => $event->visibility,
                    'participants'   => implode(', ', array_map(fn($u) => $u['full_name'] ?? $u['name'] ?? '', array_values($this->resolveUserNames($event->load('participants')->participants->pluck('user_id')->toArray())))),
                ],
            ]);
        } catch (\Throwable) {}

        return response()->json(['data' => $event->load('participants')], 201);
    }

    /**
     * GET /v1/admin/calendar/{id}
     */
    public function show(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $event    = CalendarEvent::with('participants')->findOrFail($id);
        $allUserIds = collect([$event->user_id])
            ->merge($event->participants->pluck('user_id'))
            ->unique()->filter()->values()->toArray();

        $users = $this->resolveUserNames($allUserIds);

        $arr = $event->toArray();
        $arr['creator_name'] = $users[$event->user_id]['full_name'] ?? null;
        $arr['participants'] = $event->participants->map(function ($p) use ($users) {
            return [
                'id'        => $p->id,
                'user_id'   => $p->user_id,
                'full_name' => $users[$p->user_id]['full_name'] ?? null,
                'division'  => $users[$p->user_id]['division']  ?? null,
                'status'    => $p->status,
            ];
        });

        return response()->json(['data' => $arr]);
    }

    /**
     * PUT /v1/admin/calendar/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $event = CalendarEvent::findOrFail($id);

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
            'location'    => 'nullable|string|max:255',
        ]);

        $event->update($validated);

        return response()->json(['data' => $event->load('participants')]);
    }

    /**
     * DELETE /v1/admin/calendar/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        CalendarEvent::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * POST /v1/admin/calendar/{id}/participants
     * Assign peserta ke event (bulk)
     * Body: { "user_ids": ["uuid1", "uuid2"] }
     */
    public function addParticipants(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);
        $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'uuid',
            'group_ids'  => 'nullable|array',
            'group_ids.*'=> 'uuid',
        ]);
        $event = CalendarEvent::findOrFail($id);

        if (!empty($request->user_ids)) {
            $this->syncParticipants($event, $request->user_ids);
            $this->notifyParticipants($event, $request->user_ids);
        }

        $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');

        foreach ($request->group_ids ?? [] as $groupId) {
            try {
                $groupResp = \Illuminate\Support\Facades\Http::timeout(5)->get("{$authUrl}/api/v1/internal/user-groups/{$groupId}");
                if (!$groupResp->successful()) continue;
                $group     = $groupResp->json('data');
                $groupName = $group['name'] ?? 'Group';

                \Illuminate\Support\Facades\DB::table('calendar_event_participants')->insertOrIgnore([
                    'id'         => (string) \Illuminate\Support\Str::uuid(),
                    'event_id'   => $event->id,
                    'user_id'    => null,
                    'group_id'   => $groupId,
                    'group_name' => $groupName,
                    'status'     => 'invited',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Illuminate\Support\Facades\Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send-group", [
                    'group_name' => $groupName,
                    'type'       => 'calendar.event_created',
                    'payload'    => [
                        'event_title' => $event->title,
                        'event_type'  => $event->type,
                        'start_date'  => $event->start_date?->toDateString(),
                        'start_time'  => $event->start_time,
                        'end_time'    => $event->end_time,
                        'all_day'     => $event->all_day,
                        'location'    => $event->location,
                        'participants' => $groupName,
                    ],
                ]);
            } catch (\Throwable) {}
        }

        $users = $this->resolveUserNames($request->user_ids ?? []);
        $participants = $event->participants()->get()->map(function ($p) use ($users) {
            return [
                'id'         => $p->id,
                'user_id'    => $p->user_id,
                'group_id'   => $p->group_id ?? null,
                'group_name' => $p->group_name ?? null,
                'full_name'  => $p->group_name ?? ($users[$p->user_id]['full_name'] ?? null),
                'status'     => $p->status,
            ];
        });

        return response()->json([
            'message'      => 'Peserta berhasil ditambahkan',
            'participants' => $participants,
        ]);
    }

    /**
     * DELETE /v1/admin/calendar/{id}/participants/{user_id}
     * Hapus satu peserta dari event
     */
    public function removeParticipant(string $id, string $userId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        CalendarEvent::findOrFail($id); // pastikan event ada

        $deleted = CalendarEventParticipant::where('event_id', $id)
            ->where('user_id', $userId)
            ->delete();

        abort_if(!$deleted, 404, 'Peserta tidak ditemukan');

        return response()->json(null, 204);
    }

    /**
     * GET /v1/admin/calendar/{id}/participants
     * List peserta event
     */
    public function participants(string $id): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'administrator']);

        $event        = CalendarEvent::with('participants')->findOrFail($id);
        $participantIds = $event->participants->pluck('user_id')->filter()->values()->toArray();
        $users          = $this->resolveUserNames($participantIds);

        $result = $event->participants->map(function ($p) use ($users) {
            if ($p->group_id) {
                return [
                    'id'         => $p->id,
                    'group_id'   => $p->group_id,
                    'group_name' => $p->group_name,
                    'full_name'  => $p->group_name,
                    'is_group'   => true,
                    'status'     => $p->status,
                    'created_at' => $p->created_at,
                ];
            }
            return [
                'id'          => $p->id,
                'user_id'     => $p->user_id,
                'full_name'   => $users[$p->user_id]['full_name'] ?? null,
                'division'    => $users[$p->user_id]['division']  ?? null,
                'is_group'    => false,
                'status'      => $p->status,
                'assigned_by' => $p->assigned_by,
                'created_at'  => $p->created_at,
            ];
        });

        return response()->json(['data' => $result]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function syncParticipants(CalendarEvent $event, array $userIds): void
    {
        $existing = $event->participants()->pluck('user_id')->toArray();
        $newIds   = array_diff($userIds, $existing);

        foreach ($newIds as $userId) {
            CalendarEventParticipant::create([
                'event_id'    => $event->id,
                'user_id'     => $userId,
                'status'      => 'invited',
                'assigned_by' => $this->authId(),
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
                    'type'    => 'calendar.event_assigned',
                    'payload' => [
                        'event_id'     => $event->id,
                        'event_title'  => $event->title,
                        'event_type'   => $event->type,
                        'start_date'   => $event->start_date->toDateString(),
                        'end_date'     => $event->end_date->toDateString(),
                        'start_time'   => $event->start_time,
                        'end_time'     => $event->end_time,
                        'all_day'      => $event->all_day,
                        'location'     => $event->location,
                        'participants' => implode(', ', array_map(fn($u) => $u['full_name'] ?? $u['name'] ?? '', array_values($this->resolveUserNames($event->load('participants')->participants->pluck('user_id')->toArray())))),
                    ],
                ]);
            } catch (\Throwable) {}
        }
    }
}
