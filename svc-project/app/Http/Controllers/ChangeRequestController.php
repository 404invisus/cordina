<?php
namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\CrApproval;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ChangeRequestController extends Controller
{
    // ── Notify helper ──
    private function notifyUser(string $userId, string $type, array $payload): void
    {
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
        try {
            Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                'user_id' => $userId,
                'type'    => $type,
                'payload' => $payload,
            ]);
        } catch (\Throwable) {}
    }

    private function log(string $crId, string $actorId, string $action, ?string $note = null, array $meta = []): void
    {
        \Illuminate\Support\Facades\DB::table('cr_activity_logs')->insert([
            'id'       => (string) \Illuminate\Support\Str::uuid(),
            'cr_id'    => $crId,
            'actor_id' => $actorId,
            'action'   => $action,
            'note'     => $note,
            'meta'     => $meta ? json_encode($meta) : null,
            'created_at' => now(),
        ]);
    }

    private function notifyPayload(ChangeRequest $cr): array
    {
        return [
            'cr_id'       => $cr->id,
            'cr_title'    => $cr->title,
            'cr_priority' => $cr->priority,
            'cr_type'     => $cr->change_type,
            'reviewer_note' => $cr->reviewer_note,
        ];
    }

    // ── GET /v1/change-requests/summary ──
    public function summary(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $roles  = (array) ($request->attributes->get('jwt_roles') ?? []);
        $canViewAll = !empty(array_intersect($roles, ['kepala_balai', 'administrator']));

        $query = ChangeRequest::query();

        if (!$canViewAll) {
            $approverCrIds = CrApproval::where('approver_id', $userId)->pluck('cr_id');
            $query->where(function ($q) use ($userId, $approverCrIds) {
                $q->where('requester_id', $userId)
                  ->orWhereIn('id', $approverCrIds)
                  ->orWhereJsonContains('pelaksana_ids', $userId);
            });
        }

        $total = (clone $query)->count();
        $byStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statuses = ['draft', 'submitted', 'approved', 'rejected', 'implemented'];
        $statusCounts = [];
        foreach ($statuses as $s) {
            $statusCounts[$s] = $byStatus[$s] ?? 0;
        }

        return response()->json(['data' => [
            'total'  => $total,
            'by_status' => $statusCounts,
        ]]);
    }

    // ── GET /v1/change-requests ──
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $roles  = (array) ($request->attributes->get('jwt_roles') ?? []);
        $canViewAll = !empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'administrator']));

        $query = ChangeRequest::with(['approvals'])->orderByDesc('created_at');

        if (!$canViewAll) {
            // user biasa: lihat CR milik sendiri ATAU yang dia jadi approver
            $approverCrIds = CrApproval::where('approver_id', $userId)->pluck('cr_id');
            $query->where(function ($q) use ($userId, $approverCrIds) {
                $q->where('requester_id', $userId)->orWhereIn('id', $approverCrIds);
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    // ── POST /v1/change-requests ──
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'                       => 'required|string|max:255',
            'description'                 => 'required|string',
            'reason'                      => 'required|string',
            'impact'                      => 'nullable|string',
            'priority'                    => 'required|in:low,medium,high,critical',
            'change_type'                 => 'required|in:normal,emergency,standard',
            'rincian'                     => 'nullable|string',
            'rencana_waktu'               => 'nullable|date',
            'dependensi_layanan'          => 'nullable|string',
            'si_terdampak'                => 'nullable|string',
            'langkah_mitigasi'            => 'nullable|string',
            'risiko_tidak_dilakukan'      => 'nullable|string',
            'langkah_penanganan_kegagalan'=> 'nullable|string',
            'pelaksana_ids'               => 'nullable|array',
            'pelaksana_ids.*'             => 'uuid',
            'reviewer_ids'                => 'required|array|min:1',
            'reviewer_ids.*'              => 'required|uuid',
            'signer_id'                   => 'required|uuid',
        ]);

        $reviewerIds = $data['reviewer_ids'];
        $signerId    = $data['signer_id'];
        unset($data['reviewer_ids'], $data['signer_id']);

        $data['requester_id'] = $request->attributes->get('jwt_user_id');
        $data['status']       = 'draft';
        $data['current_step'] = 0;
        $data['total_steps']  = count($reviewerIds) + 1; // reviewers + signer
        $data['signer_id']    = $signerId;

        DB::transaction(function () use (&$cr, $data, $reviewerIds, $signerId) {
            $cr = ChangeRequest::create($data);

            // Buat approval steps: reviewer 1,2,3... lalu signer terakhir
            foreach ($reviewerIds as $idx => $uid) {
                CrApproval::create([
                    'cr_id'       => $cr->id,
                    'approver_id' => $uid,
                    'role'        => 'reviewer',
                    'order'       => $idx + 1,
                    'status'      => 'pending',
                ]);
            }
            CrApproval::create([
                'cr_id'       => $cr->id,
                'approver_id' => $signerId,
                'role'        => 'signer',
                'order'       => count($reviewerIds) + 1,
                'status'      => 'pending',
            ]);
        });

        $this->log($cr->id, $data['requester_id'], 'created', 'CR dibuat');
        \App\Services\ActivityLogger::log($data['requester_id'], 'cr.created', "Membuat CR: {$cr->title}", true, ['cr_id' => $cr->id]);
        return response()->json(['data' => $cr->load('approvals')], 201);
    }

    // ── GET /v1/change-requests/{id} ──
    public function show(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::with('approvals')->findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');
        $roles  = (array) ($request->attributes->get('jwt_roles') ?? []);

        $isApprover  = $cr->approvals->contains('approver_id', $userId);
        $canView     = $cr->requester_id === $userId
            || $isApprover
            || !empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'administrator']));

        abort_if(!$canView, 403, 'Forbidden');
        return response()->json(['data' => $cr]);
    }

    // ── PUT /v1/change-requests/{id} ──
    public function update(Request $request, string $id): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if(!in_array($cr->status, ['draft', 'rejected']), 422, 'Hanya CR berstatus draft atau rejected yang bisa diedit');

        $data = $request->validate([
            'title'                       => 'sometimes|string|max:255',
            'description'                 => 'sometimes|string',
            'reason'                      => 'sometimes|string',
            'impact'                      => 'nullable|string',
            'priority'                    => 'sometimes|in:low,medium,high,critical',
            'change_type'                 => 'sometimes|in:normal,emergency,standard',
            'rincian'                     => 'nullable|string',
            'rencana_waktu'               => 'nullable|date',
            'dependensi_layanan'          => 'nullable|string',
            'si_terdampak'                => 'nullable|string',
            'langkah_mitigasi'            => 'nullable|string',
            'risiko_tidak_dilakukan'      => 'nullable|string',
            'langkah_penanganan_kegagalan'=> 'nullable|string',
            'pelaksana_ids'               => 'nullable|array',
            'pelaksana_ids.*'             => 'uuid',
        ]);

        $cr->update($data);
        return response()->json(['data' => $cr]);
    }

    // ── POST /v1/change-requests/{id}/submit ──
    public function submit(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::with('approvals')->findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if(!in_array($cr->status, ['draft', 'rejected']), 422, 'Hanya CR berstatus draft atau rejected yang bisa disubmit');

        $cr->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'current_step' => 1,
            'reviewer_note'=> null,
        ]);

        // Notify approver pertama (reviewer 1)
        $first = $cr->approvals->where('order', 1)->first();
        if ($first) {
            $this->notifyUser($first->approver_id, 'change_request.submitted', $this->notifyPayload($cr));
        }

        \App\Services\ActivityLogger::log($userId, 'cr.signed', "Menandatangani CR: {$cr->title}", true, ['cr_id' => $cr->id]);
        return response()->json(['data' => $cr->fresh('approvals')]);
    }

    // ── POST /v1/change-requests/{id}/approve ──
    public function approve(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::with('approvals')->findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->status !== 'submitted', 422, 'CR harus berstatus submitted');

        // Cari approval step yang sekarang aktif milik user ini
        $approval = $cr->approvals
            ->where('order', $cr->current_step)
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->first();

        abort_if(!$approval, 403, 'Bukan giliran Anda atau Anda bukan approver CR ini');

        $request->validate(['note' => 'nullable|string']);

        DB::transaction(function () use ($cr, $approval, $request, $userId) {
            // Tandai step ini approved
            $approval->update([
                'status'   => 'approved',
                'note'     => $request->note,
                'acted_at' => now(),
            ]);

            $nextStep = $cr->current_step + 1;

            if ($nextStep > $cr->total_steps) {
                // Semua step selesai
                $cr->update([
                    'status'      => 'approved',
                    'reviewer_id' => $userId,
                    'reviewed_at' => now(),
                    'current_step'=> $cr->total_steps,
                ]);
                $this->notifyUser($cr->requester_id, 'change_request.approved', $this->notifyPayload($cr));
                $this->log($cr->id, $userId, 'approved', $request->note);
            } else {
                // Advance ke step berikutnya
                $cr->update(['current_step' => $nextStep]);

                $nextApproval = $cr->approvals->where('order', $nextStep)->first();
                if ($nextApproval) {
                    $this->notifyUser($nextApproval->approver_id, 'change_request.review_request', $this->notifyPayload($cr));
                }
                $this->log($cr->id, $userId, 'reviewed', $request->note);
            }
        });

        return response()->json(['data' => $cr->fresh('approvals')]);
    }

    // ── POST /v1/change-requests/{id}/reject ──
    public function reject(Request $request, string $id): JsonResponse
    {
        $cr     = ChangeRequest::with('approvals')->findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->status !== 'submitted', 422, 'CR harus berstatus submitted');

        $approval = $cr->approvals
            ->where('order', $cr->current_step)
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->first();

        abort_if(!$approval, 403, 'Bukan giliran Anda atau Anda bukan approver CR ini');

        $request->validate(['note' => 'required|string']);

        DB::transaction(function () use ($cr, $approval, $request, $userId) {
            $approval->update([
                'status'   => 'rejected',
                'note'     => $request->note,
                'acted_at' => now(),
            ]);

            $cr->update([
                'status'        => 'rejected',
                'reviewer_id'   => $userId,
                'reviewed_at'   => now(),
                'reviewer_note' => $request->note,
            ]);
        });

        $this->notifyUser($cr->requester_id, 'change_request.rejected', $this->notifyPayload($cr));
        $this->log($cr->id, $userId, 'rejected', $request->note);
        return response()->json(['data' => $cr->fresh('approvals')]);
    }

    // ── DELETE /v1/change-requests/{id} ──
    public function destroy(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if($cr->status === 'approved', 422, 'CR yang sudah approved tidak bisa dihapus');

        $cr->delete();
        return response()->json(null, 204);
    }
    // ── POST /v1/change-requests/{id}/sign ──
    public function sign(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::with('approvals')->findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->status !== 'submitted', 422, 'CR harus berstatus submitted');

        $approval = $cr->approvals
            ->where('order', $cr->current_step)
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->where('role', 'signer')
            ->first();

        abort_if(!$approval, 403, 'Anda bukan penandatangan CR ini atau bukan giliran Anda');

        $request->validate(['passphrase' => 'required|string']);

        // Ambil data user dari svc-auth
        $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $signerData    = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users/{$userId}")->json('data') ?? [];
        $requesterData = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users/{$cr->requester_id}")->json('data') ?? [];

        // Ambil data reviewers
        $reviewerApprovals = $cr->approvals->where('role', 'reviewer')->sortBy('order');
        $reviewers = [];
        foreach ($reviewerApprovals as $ra) {
            $u = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users/{$ra->approver_id}")->json('data') ?? [];
            if ($u) $reviewers[] = $u;
        }

        // Ambil data pelaksana
        $pelaksana = [];
        foreach (($cr->pelaksana_ids ?? []) as $pid) {
            $u = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users/{$pid}")->json('data') ?? [];
            if ($u) $pelaksana[] = $u;
        }

        // Generate PDF
        $pdfService = new \App\Services\CrPdfService();
        $pdfContent = $pdfService->generate($cr, $requesterData, $signerData, $reviewers, $pelaksana);

        // Sign via TTE API
        $nik        = $signerData['nik'] ?? null;
        $specimenId = $signerData['tte_specimen_url'] ?? null;

        abort_if(!$nik, 422, 'NIK penandatangan belum diset di profil');

        // Sign via esign-api (INVISIBLE) — spesimen sudah embed di PDF via CrPdfService
        $esignUrl = rtrim(config('services.esign.url', 'http://esign-api:8080'), '/');
        $esignKey = env('ESIGN_API_KEY', '');

        // Warmup
        try { Http::timeout(5)->get("{$esignUrl}/health"); } catch (\Throwable) {}

        $tmpPdf = tempnam('/tmp', 'crsign_') . '.pdf';
        file_put_contents($tmpPdf, $pdfContent);

        $ch = curl_init($esignUrl . '/v1/sign/pdf');
        curl_setopt_array($ch, [
            CURLOPT_POST       => true,
            CURLOPT_POSTFIELDS => [
                'file'       => new \CURLFile($tmpPdf, 'application/pdf', 'cr_' . $cr->id . '.pdf'),
                'nik'        => $nik,
                'passphrase' => $request->passphrase,
                'appearance' => 'INVISIBLE',
            ],
            CURLOPT_HTTPHEADER     => ['X-API-Key: ' . $esignKey],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 90,
        ]);
        $signedBinary = curl_exec($ch);
        $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError    = curl_error($ch);
        curl_close($ch);
        @unlink($tmpPdf);

        if ($httpCode !== 200) {
            $err = json_decode($signedBinary, true);
            abort(422, $err['error']['message_id'] ?? ('Gagal menandatangani: HTTP ' . $httpCode . ' ' . $curlError));
        }

        $tteResponse = new class($signedBinary) {
            private string $body;
            public function __construct(string $body) { $this->body = $body; }
            public function successful(): bool { return str_starts_with($this->body, '%PDF'); }
            public function body(): string { return $this->body; }
            public function json(?string $key = null) { return null; }
        };

        abort_if(!$tteResponse->successful(), 422, 'Gagal menandatangani via TTE: ' . ($tteResponse->json('message') ?? $tteResponse->body()));

        // Simpan PDF ter-TTE ke storage (binary langsung dari esign-api)
        $filename = 'cr_signed_' . $cr->id . '_' . time() . '.pdf';
        $path     = 'change_requests/' . $filename;
        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $signedBinary);

        $attachId = (string) \Illuminate\Support\Str::uuid();
        \Illuminate\Support\Facades\DB::table('attachments')->insert([
            'id'         => $attachId,
            'task_id'    => null,
            'user_id'    => $userId,
            'file_name'  => $filename,
            'file_path'  => $path,
            'mime_type'  => 'application/pdf',
            'file_size'  => strlen($signedBinary),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update CR
        DB::transaction(function () use ($cr, $approval, $userId, $attachId) {
            $approval->update(['status' => 'approved', 'acted_at' => now()]);
            $cr->update([
                'status'             => 'approved',
                'reviewer_id'        => $userId,
                'reviewed_at'        => now(),
                'current_step'       => $cr->total_steps,
                'signed_document_id' => $attachId,
            ]);
        });

        $this->notifyUser($cr->requester_id, 'change_request.approved', $this->notifyPayload($cr));

        return response()->json(['data' => $cr->fresh('approvals'), 'message' => 'Dokumen berhasil ditandatangani']);
    }

    // ── GET /v1/change-requests/{id}/document ──
    public function downloadDocument(string $id, Request $request): mixed
    {
        $cr = ChangeRequest::findOrFail($id);
        abort_if(!$cr->signed_document_id, 404, 'Dokumen belum ditandatangani');

        $attachment = \Illuminate\Support\Facades\DB::table('attachments')->where('id', $cr->signed_document_id)->first();
        abort_if(!$attachment, 404, 'File tidak ditemukan');
        abort_if(!\Illuminate\Support\Facades\Storage::disk('local')->exists($attachment->file_path), 404, 'File tidak ditemukan di storage');

        return response()->download(
            \Illuminate\Support\Facades\Storage::disk('local')->path($attachment->file_path),
            $attachment->file_name
        );
    }

    // ── POST /v1/change-requests/{id}/implement ──
    public function implement(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Hanya pembuat CR yang bisa menandai sebagai diimplementasikan');
        abort_if($cr->status !== 'approved', 422, 'CR harus berstatus disetujui terlebih dahulu');

        $request->validate(['catatan' => 'nullable|string|max:500']);

        $cr->update([
            'status'        => 'implemented',
            'reviewer_note' => $request->catatan,
        ]);

        $this->notifyUser($cr->requester_id, 'change_request.implemented', $this->notifyPayload($cr));
        $this->log($cr->id, $userId, 'implemented', $request->catatan);

        return response()->json(['data' => $cr->fresh('approvals')]);
    }

    // ── GET /v1/change-requests/{id}/logs ──
    public function logs(string $id, Request $request): JsonResponse
    {
        ChangeRequest::findOrFail($id);
        $logs = \Illuminate\Support\Facades\DB::table('cr_activity_logs')
            ->where('cr_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json(['data' => $logs]);
    }

}
