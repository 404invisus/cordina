<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TteSignRequestController extends Controller
{
    private function authUrl(): string
    {
        return rtrim(config('services.auth.url', 'http://svc-auth'), '/');
    }

    private function notifUrl(): string
    {
        return rtrim(config('services.notification.url', 'http://svc-notification'), '/');
    }

    private function sendNotif(string $userId, string $type, array $payload): void
    {
        try {
            Http::timeout(5)->post("{$this->notifUrl()}/api/v1/notifications/send", [
                'user_id' => $userId,
                'type'    => $type,
                'payload' => $payload,
            ]);
        } catch (\Throwable) {}
    }

    private function addLog(string $signRequestId, string $userId, string $action, ?string $note = null): void
    {
        DB::table('tte_sign_request_logs')->insert([
            'id'              => (string) Str::uuid(),
            'sign_request_id' => $signRequestId,
            'user_id'         => $userId,
            'action'          => $action,
            'note'            => $note,
            'created_at'      => now(),
        ]);
    }

    private function resolveUsers(array $ids): array
    {
        if (empty($ids)) return [];
        try {
            $resp = Http::timeout(5)->post("{$this->authUrl()}/api/v1/internal/users/batch", ['ids' => $ids]);
            return collect($resp->json('data') ?? [])->keyBy('id')->toArray();
        } catch (\Throwable) { return []; }
    }

    // POST /v1/tte-sign-requests — buat request baru
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'file'        => 'required|file|mimes:pdf|max:512',
            'signer_ids'  => 'required|array|min:1|max:10',
            'signer_ids.*'=> 'uuid',
        ]);

        $userId = $request->attributes->get('jwt_user_id');

        // Upload file original
        $pdfContent = file_get_contents($request->file('file')->getRealPath());
        $origName   = $request->file('file')->getClientOriginalName();
        $filename   = 'tte_orig_' . Str::uuid() . '.pdf';
        $path       = "tte/{$userId}/{$filename}";
        Storage::disk('local')->put($path, $pdfContent);

        $attachId = (string) Str::uuid();
        DB::table('attachments')->insert([
            'id'         => $attachId,
            'user_id'    => $userId,
            'file_name'  => $origName,
            'file_path'  => $path,
            'mime_type'  => 'application/pdf',
            'file_size'  => strlen($pdfContent),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $reqId = (string) Str::uuid();
        DB::table('tte_sign_requests')->insert([
            'id'                     => $reqId,
            'title'                  => $request->title,
            'creator_id'             => $userId,
            'original_attachment_id' => $attachId,
            'status'                 => 'waiting_signature',
            'description'            => $request->description,
            'created_at'             => now(),
            'updated_at'             => now(),
        ]);

        // Tambah creator sebagai signer pertama (order 1)
        $signerIds = array_values(array_unique(array_filter($request->signer_ids)));
        // Pastikan creator selalu order 1
        $allSigners = array_merge([$userId], array_filter($signerIds, fn($id) => $id !== $userId));

        foreach ($allSigners as $order => $signerId) {
            DB::table('tte_sign_request_signers')->insert([
                'id'              => (string) Str::uuid(),
                'sign_request_id' => $reqId,
                'user_id'         => $signerId,
                'order'           => $order + 1,
                'status'          => $order === 0 ? 'pending' : 'pending',
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->addLog($reqId, $userId, 'created', "Dokumen dibuat dengan " . count($allSigners) . " penandatangan");

        // Notif ke signer pertama (creator sendiri)
        $this->sendNotif($userId, 'tte.sign_requested', [
            'request_id'    => $reqId,
            'request_title' => $request->title,
            'order'         => 1,
        ]);

        return response()->json(['data' => ['id' => $reqId], 'message' => 'Permintaan TTE dibuat'], 201);
    }

    // GET /v1/tte-sign-requests — list semua yang relevan untuk user ini
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');

        // Dokumen yang dibuat user ATAU user adalah signer ATAU user adalah penerima distribusi
        $reqIds = DB::table('tte_sign_request_signers')->where('user_id', $userId)->pluck('sign_request_id')
            ->merge(DB::table('tte_sign_request_distributions')->where('user_id', $userId)->pluck('sign_request_id'))
            ->unique()->values()->toArray();

        $ownReqs = DB::table('tte_sign_requests')->where('creator_id', $userId)->pluck('id')->toArray();
        $allIds  = array_unique(array_merge($ownReqs, $reqIds));

        $reqs = DB::table('tte_sign_requests')
            ->whereIn('id', $allIds)
            ->orderByDesc('created_at')
            ->get();

        $userIds = $reqs->pluck('creator_id')->unique()->values()->toArray();
        $users   = $this->resolveUsers($userIds);

        $result = $reqs->map(function ($r) use ($users, $userId) {
            $signers = DB::table('tte_sign_request_signers')
                ->where('sign_request_id', $r->id)
                ->orderBy('order')
                ->get();

            $myRole = 'viewer';
            if ($r->creator_id === $userId) $myRole = 'creator';
            elseif ($signers->contains('user_id', $userId)) $myRole = 'signer';

            $mySigner = $signers->firstWhere('user_id', $userId);
            $currentOrder = $signers->where('status', 'pending')->min('order');

            return [
                'id'           => $r->id,
                'title'        => $r->title,
                'status'       => $r->status,
                'description'  => $r->description,
                'creator'      => $users[$r->creator_id] ?? ['id' => $r->creator_id, 'full_name' => 'Unknown'],
                'created_at'   => $r->created_at,
                'signer_count' => $signers->count(),
                'signed_count' => $signers->where('status', 'signed')->count(),
                'my_role'      => $myRole,
                'my_status'    => $mySigner?->status ?? null,
                'my_order'     => $mySigner?->order ?? null,
                'can_sign'     => $mySigner && $mySigner->status === 'pending' && $mySigner->order === $currentOrder,
                'can_distribute' => $r->creator_id === $userId && $r->status === 'signed',
            ];
        });

        return response()->json(['data' => $result]);
    }

    // GET /v1/tte-sign-requests/{id} — detail
    public function show(string $id, Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $req    = DB::table('tte_sign_requests')->where('id', $id)->first();
        abort_if(!$req, 404, 'Dokumen tidak ditemukan');

        // Cek akses: creator, signer, atau penerima distribusi
        $isSigner = DB::table('tte_sign_request_signers')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        $isDist   = DB::table('tte_sign_request_distributions')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        abort_if($req->creator_id !== $userId && !$isSigner && !$isDist, 403, 'Tidak punya akses ke dokumen ini');

        $signers = DB::table('tte_sign_request_signers')
            ->where('sign_request_id', $id)
            ->orderBy('order')
            ->get();

        $signerUserIds = $signers->pluck('user_id')->unique()->values()->toArray();
        $users = $this->resolveUsers(array_unique(array_merge([$req->creator_id], $signerUserIds)));

        $logs = DB::table('tte_sign_request_logs')
            ->where('sign_request_id', $id)
            ->orderBy('created_at')
            ->get();

        $logUserIds = $logs->pluck('user_id')->unique()->values()->toArray();
        $logUsers   = $this->resolveUsers($logUserIds);

        $distributions = DB::table('tte_sign_request_distributions')
            ->where('sign_request_id', $id)
            ->get();
        $distUserIds = $distributions->pluck('user_id')->toArray();
        $distUsers   = $this->resolveUsers($distUserIds);

        $currentOrder = $signers->where('status', 'pending')->min('order');
        $mySigner     = $signers->firstWhere('user_id', $userId);

        return response()->json(['data' => [
            'id'          => $req->id,
            'title'       => $req->title,
            'description' => $req->description,
            'status'      => $req->status,
            'creator'     => $users[$req->creator_id] ?? null,
            'created_at'  => $req->created_at,
            'original_attachment_id' => $req->original_attachment_id,
            'signed_attachment_id'   => $req->signed_attachment_id,
            'can_sign'    => $mySigner && $mySigner->status === 'pending' && $mySigner->order === $currentOrder,
            'can_distribute' => $req->creator_id === $userId && $req->status === 'signed',
            'my_role'     => $req->creator_id === $userId ? 'creator' : ($isSigner ? 'signer' : 'viewer'),
            'signers'     => $signers->map(fn($s) => [
                'id'        => $s->id,
                'user'      => $users[$s->user_id] ?? ['id' => $s->user_id, 'full_name' => 'Unknown'],
                'order'     => $s->order,
                'status'    => $s->status,
                'signed_at' => $s->signed_at,
                'note'      => $s->note,
            ]),
            'logs' => $logs->map(fn($l) => [
                'user'       => $logUsers[$l->user_id] ?? ['full_name' => 'Unknown'],
                'action'     => $l->action,
                'note'       => $l->note,
                'created_at' => $l->created_at,
            ]),
            'distributions' => $distributions->map(fn($d) => [
                'user'           => $distUsers[$d->user_id] ?? ['full_name' => 'Unknown'],
                'distributed_at' => $d->distributed_at,
            ]),
        ]]);
    }

    // POST /v1/tte-sign-requests/{id}/sign — tandatangani
    public function sign(string $id, Request $request): JsonResponse
    {
        $request->validate(['passphrase' => 'required|string']);
        $userId = $request->attributes->get('jwt_user_id');

        $req = DB::table('tte_sign_requests')->where('id', $id)->first();
        abort_if(!$req, 404, 'Dokumen tidak ditemukan');
        abort_if($req->status !== 'waiting_signature', 422, 'Dokumen tidak dalam status menunggu tanda tangan');

        $signer = DB::table('tte_sign_request_signers')
            ->where('sign_request_id', $id)
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->first();
        abort_if(!$signer, 403, 'Anda bukan penandatangan atau sudah menandatangani');

        $currentOrder = DB::table('tte_sign_request_signers')
            ->where('sign_request_id', $id)
            ->where('status', 'pending')
            ->min('order');
        abort_if($signer->order !== $currentOrder, 422, 'Belum giliran Anda menandatangani (urutan ke-' . $signer->order . ')');

        // Ambil NIK user
        $userData = Http::timeout(5)->get("{$this->authUrl()}/api/v1/internal/users/{$userId}")->json('data') ?? [];
        $nik      = $userData['nik'] ?? null;
        abort_if(!$nik, 422, 'NIK belum diset di profil');

        // Tentukan file PDF yang akan di-sign (hasil signer sebelumnya atau original)
        $prevSignedAttachId = DB::table('tte_sign_request_signers')
            ->where('sign_request_id', $id)
            ->where('status', 'signed')
            ->orderByDesc('order')
            ->value('signed_attachment_id') ?? null;

        $sourceAttachId = $prevSignedAttachId ?? $req->original_attachment_id;
        $attachment = DB::table('attachments')->where('id', $sourceAttachId)->first();
        abort_if(!$attachment || !Storage::disk('local')->exists($attachment->file_path), 422, 'File sumber tidak ditemukan');

        $pdfContent = file_get_contents(Storage::disk('local')->path($attachment->file_path));

        // Sign via esign-api (warmup dulu)
        $esignUrl = rtrim(env('ESIGN_API_URL', 'http://esign-api:8080'), '/');
        $esignKey = env('ESIGN_API_KEY', '');

        // Warmup
        try { Http::timeout(5)->get("{$esignUrl}/health"); } catch (\Throwable) {}

        $tmpPdf = tempnam('/tmp', 'ttesign_') . '.pdf';
        $tmpOut = tempnam('/tmp', 'ttesign_out_');
        file_put_contents($tmpPdf, $pdfContent);

        $ch = curl_init($esignUrl . '/v1/sign/pdf');
        curl_setopt_array($ch, [
            CURLOPT_POST       => true,
            CURLOPT_POSTFIELDS => [
                'file'       => new \CURLFile($tmpPdf, 'application/pdf', 'document.pdf'),
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
        abort_if(!str_starts_with($signedBinary, '%PDF'), 422, 'Hasil TTE bukan PDF valid');

        // Simpan hasil sign
        $newFilename  = 'tte_signed_' . Str::uuid() . '.pdf';
        $newPath      = "tte/{$userId}/{$newFilename}";
        Storage::disk('local')->put($newPath, $signedBinary);

        $newAttachId = (string) Str::uuid();
        DB::table('attachments')->insert([
            'id'         => $newAttachId,
            'user_id'    => $userId,
            'file_name'  => 'signed_' . $attachment->file_name,
            'file_path'  => $newPath,
            'mime_type'  => 'application/pdf',
            'file_size'  => strlen($signedBinary),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update signer record
        DB::table('tte_sign_request_signers')
            ->where('id', $signer->id)
            ->update([
                'status'              => 'signed',
                'signed_at'           => now(),
                'signed_attachment_id'=> $newAttachId,
                'updated_at'          => now(),
            ]);

        $this->addLog($id, $userId, 'signed', "Ditandatangani oleh " . ($userData['full_name'] ?? $userId) . " (urutan ke-{$signer->order})");

        // Cek apakah semua signer sudah selesai
        $pendingCount = DB::table('tte_sign_request_signers')
            ->where('sign_request_id', $id)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount === 0) {
            // Semua sudah sign → update status dokumen ke 'signed'
            DB::table('tte_sign_requests')->where('id', $id)->update([
                'status'               => 'signed',
                'signed_attachment_id' => $newAttachId,
                'updated_at'           => now(),
            ]);
            $this->addLog($id, $userId, 'all_signed', 'Semua penandatangan telah menandatangani dokumen');

            // Notif ke creator
            $this->sendNotif($req->creator_id, 'tte.all_signed', [
                'request_id'    => $id,
                'request_title' => $req->title,
            ]);
        } else {
            // Notif ke signer berikutnya
            $nextSigner = DB::table('tte_sign_request_signers')
                ->where('sign_request_id', $id)
                ->where('status', 'pending')
                ->orderBy('order')
                ->first();
            if ($nextSigner) {
                $this->sendNotif($nextSigner->user_id, 'tte.sign_requested', [
                    'request_id'    => $id,
                    'request_title' => $req->title,
                    'order'         => $nextSigner->order,
                ]);
            }
        }

        return response()->json(['message' => 'Dokumen berhasil ditandatangani']);
    }

    // POST /v1/tte-sign-requests/{id}/distribute — distribusikan ke user lain
    public function distribute(string $id, Request $request): JsonResponse
    {
        $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'uuid',
            'group_ids'  => 'nullable|array',
            'group_ids.*'=> 'uuid',
        ]);
        abort_if(empty($request->user_ids) && empty($request->group_ids), 422, 'Pilih minimal 1 penerima atau group');

        $userId = $request->attributes->get('jwt_user_id');
        $req    = DB::table('tte_sign_requests')->where('id', $id)->first();
        abort_if(!$req, 404, 'Dokumen tidak ditemukan');
        abort_if($req->creator_id !== $userId, 403, 'Hanya pembuat dokumen yang bisa mendistribusikan');
        abort_if($req->status !== 'signed', 422, 'Dokumen belum selesai ditandatangani');

        $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
        $totalPenerima = 0;

        foreach ($request->user_ids ?? [] as $recipientId) {
            DB::table('tte_sign_request_distributions')->insertOrIgnore([
                'id'              => (string) Str::uuid(),
                'sign_request_id' => $id,
                'user_id'         => $recipientId,
                'group_id'        => null,
                'group_name'      => null,
                'distributed_at'  => now(),
            ]);
            $this->sendNotif($recipientId, 'tte.distributed', [
                'request_id'    => $id,
                'request_title' => $req->title,
            ]);
            $totalPenerima++;
        }

        foreach ($request->group_ids ?? [] as $groupId) {
            try {
                $groupResp = Http::timeout(5)->get("{$authUrl}/api/v1/internal/user-groups/{$groupId}");
                if (!$groupResp->successful()) continue;
                $group     = $groupResp->json('data');
                $groupName = $group['name'] ?? 'Group';

                DB::table('tte_sign_request_distributions')->insertOrIgnore([
                    'id'              => (string) Str::uuid(),
                    'sign_request_id' => $id,
                    'user_id'         => null,
                    'group_id'        => $groupId,
                    'group_name'      => $groupName,
                    'distributed_at'  => now(),
                ]);

                Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send-group", [
                    'group_name' => $groupName,
                    'type'       => 'tte.distributed',
                    'payload'    => ['request_id' => $id, 'request_title' => $req->title],
                ]);
                $totalPenerima++;
            } catch (\Throwable) {}
        }

        DB::table('tte_sign_requests')->where('id', $id)->update([
            'status'     => 'distributed',
            'updated_at' => now(),
        ]);
        $this->addLog($id, $userId, 'distributed', "Didistribusikan ke {$totalPenerima} penerima");
        return response()->json(['message' => 'Dokumen berhasil didistribusikan']);
    }

        // POST /v1/tte-sign-requests/{id}/verify — verifikasi TTE
    public function verify(string $id, Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $req    = DB::table('tte_sign_requests')->where('id', $id)->first();
        abort_if(!$req, 404, 'Dokumen tidak ditemukan');

        $isSigner = DB::table('tte_sign_request_signers')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        $isDist   = DB::table('tte_sign_request_distributions')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        abort_if($req->creator_id !== $userId && !$isSigner && !$isDist, 403, 'Tidak punya akses');

        $attachId   = $req->signed_attachment_id ?? $req->original_attachment_id;
        $attachment = DB::table('attachments')->where('id', $attachId)->first();
        abort_if(!$attachment || !Storage::disk('local')->exists($attachment->file_path), 404, 'File tidak ditemukan');

        $pdfBytes = file_get_contents(Storage::disk('local')->path($attachment->file_path));

        $bsreBase = rtrim(\App\Services\TteConfigService::get('TTE_BASE_URL', 'http://10.31.10.90'), '/');
        $bsreUser = \App\Services\TteConfigService::get('TTE_USERNAME', 'connectone');
        $bsrePass = \App\Services\TteConfigService::get('TTE_PASSWORD', '');

        $ch = curl_init($bsreBase . '/api/v2/verify/pdf');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode(['file' => base64_encode($pdfBytes)]),
            CURLOPT_HTTPHEADER     => [
                'Authorization: Basic ' . base64_encode("{$bsreUser}:{$bsrePass}"),
                'Content-Type: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($body, true) ?? ['error' => 'Gagal memverifikasi'];
        return response()->json(['data' => $result]);
    }

    // GET /v1/tte-sign-requests/{id}/download — download PDF (signed jika ada, original jika belum)
    public function download(string $id, Request $request): mixed
    {
        $userId = $request->attributes->get('jwt_user_id');
        $req    = DB::table('tte_sign_requests')->where('id', $id)->first();
        abort_if(!$req, 404, 'Dokumen tidak ditemukan');

        $isSigner = DB::table('tte_sign_request_signers')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        $isDist   = DB::table('tte_sign_request_distributions')->where('sign_request_id', $id)->where('user_id', $userId)->exists();
        abort_if($req->creator_id !== $userId && !$isSigner && !$isDist, 403, 'Tidak punya akses');

        $attachId   = $req->signed_attachment_id ?? $req->original_attachment_id;
        $attachment = DB::table('attachments')->where('id', $attachId)->first();
        abort_if(!$attachment || !Storage::disk('local')->exists($attachment->file_path), 404, 'File tidak ditemukan');

        return response()->download(Storage::disk('local')->path($attachment->file_path), $attachment->file_name);
    }
}
