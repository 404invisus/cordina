<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EsignController extends Controller
{
    // POST /v1/esign/sign
    public function sign(Request $request): JsonResponse
    {
        $request->validate([
            'file'       => 'required|file|mimes:pdf|max:20480',
            'passphrase' => 'required|string',
            'tampilan'   => 'required|in:VISIBLE,INVISIBLE',
            'title'      => 'nullable|string|max:255',
        ]);

        $userId = $request->attributes->get('jwt_user_id');

        // Ambil NIK dan spesimen dari svc-auth
        $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $userData = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users/{$userId}")->json('data') ?? [];

        $nik        = $userData['nik'] ?? null;
        $specimenId = $userData['tte_specimen_url'] ?? null;

        abort_if(!$nik, 422, 'NIK belum diset di profil. Lengkapi data TTE terlebih dahulu.');

        // Ambil spesimen (binary) jika VISIBLE
        $specimenBinary = null;
        if ($request->tampilan === 'VISIBLE' && $specimenId) {
            $attachment = DB::table('attachments')->where('id', $specimenId)->first();
            if ($attachment && Storage::disk('local')->exists($attachment->file_path)) {
                $specimenBinary = file_get_contents(Storage::disk('local')->path($attachment->file_path));
            }
        }
        abort_if($request->tampilan === 'VISIBLE' && !$specimenBinary, 422, 'Mode VISIBLE butuh spesimen tanda tangan, tapi spesimen tidak ditemukan.');

        $pdfContent = file_get_contents($request->file('file')->getRealPath());

        // Call esign-api (wrapper internal BSrE): multipart in, PDF biner out
        $esignUrl = rtrim(env('ESIGN_API_URL', 'http://esign-api:8080'), '/');
        $esignKey = env('ESIGN_API_KEY', '');

        $req = Http::timeout(90)
            ->withHeaders(['X-API-Key' => $esignKey])
            ->attach('file', $pdfContent, 'document.pdf')
            ->attach('nik', $nik)
            ->attach('passphrase', $request->passphrase)
            ->attach('appearance', $request->tampilan);

        if ($specimenBinary) {
            $req = $req->attach('signature_image', $specimenBinary, 'specimen.png');
        }

        \Illuminate\Support\Facades\Log::info('ESIGN_SIGN_DEBUG', [
            'tampilan'     => $request->tampilan,
            'has_specimen' => (bool) $specimenBinary,
            'pdf_size'     => strlen($pdfContent),
            'nik_last4'    => substr($nik, -4),
        ]);

        // Bypass Laravel HTTP client — pakai curl langsung
        $tmpPdf = tempnam('/tmp', 'esign_') . '.pdf';
        $tmpOut = tempnam('/tmp', 'esign_out_') . '.pdf';
        file_put_contents($tmpPdf, $pdfContent);

        $curlCmd = 'curl -s -m 90 -X POST'
            . ' ' . escapeshellarg($esignUrl . '/v1/sign/pdf')
            . ' -H ' . escapeshellarg('X-API-Key: ' . $esignKey)
            . ' -F ' . escapeshellarg('nik=' . $nik)
            . ' -F ' . escapeshellarg('passphrase=' . $request->passphrase)
            . ' -F ' . escapeshellarg('file=@' . $tmpPdf)
            . ' -o ' . escapeshellarg($tmpOut)
            . ' -w ' . escapeshellarg('%{http_code}');

        if ($specimenBinary) {
            $tmpImg = tempnam('/tmp', 'esign_img_');
            file_put_contents($tmpImg, $specimenBinary);
            $curlCmd .= ' -F ' . escapeshellarg('signature_image=@' . $tmpImg);
            $curlCmd .= ' -F ' . escapeshellarg('appearance=VISIBLE');
        } else {
            $curlCmd .= ' -F ' . escapeshellarg('appearance=INVISIBLE');
        }

        \Illuminate\Support\Facades\Log::info('ESIGN_CURL_CMD', ['cmd' => $curlCmd]);
        $httpCode = trim(shell_exec($curlCmd));

        \Illuminate\Support\Facades\Log::info('ESIGN_CURL_RESULT', [
            'http_code' => $httpCode,
            'out_size'  => file_exists($tmpOut) ? filesize($tmpOut) : 0,
        ]);

        if ($httpCode !== '200') {
            $errBody = file_exists($tmpOut) ? json_decode(file_get_contents($tmpOut), true) : [];
            @unlink($tmpPdf); @unlink($tmpOut);
            abort(422, $errBody['error']['message_id'] ?? ('Gagal menandatangani via TTE: HTTP ' . $httpCode));
        }

        $signedPdfBinary = file_get_contents($tmpOut);
        @unlink($tmpPdf); @unlink($tmpOut);
        abort_if(!str_starts_with($signedPdfBinary, '%PDF'), 422, 'Hasil TTE bukan PDF yang valid');

        // Simpan PDF ter-TTE
        $origName = $request->file('file')->getClientOriginalName();
        $filename = 'esign_' . Str::uuid() . '.pdf';
        $path     = "esign/{$userId}/{$filename}";
        Storage::disk('local')->put($path, $signedPdfBinary);

        $attachId = (string) Str::uuid();
        DB::table('attachments')->insert([
            'id'          => $attachId,
            'user_id'     => $userId,
            'file_name'   => 'signed_' . $origName,
            'file_path'   => $path,
            'mime_type'   => 'application/pdf',
            'file_size'   => strlen($signedPdfBinary),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Simpan ke tabel esign_documents
        $docId = (string) Str::uuid();
        DB::table('esign_documents')->insert([
            'id'            => $docId,
            'user_id'       => $userId,
            'title'         => $request->title ?: $origName,
            'original_name' => $origName,
            'attachment_id' => $attachId,
            'tampilan'      => $request->tampilan,
            'signed_at'     => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return response()->json([
            'data' => [
                'id'            => $docId,
                'attachment_id' => $attachId,
                'title'         => $request->title ?: $origName,
                'signed_at'     => now()->toIso8601String(),
            ],
            'message' => 'Dokumen berhasil ditandatangani',
        ], 201);
    }

    // POST /v1/esign/save-signed (simpan PDF yang sudah di-sign dari esign-api)
    public function saveSigned(Request $request): JsonResponse
    {
        $request->validate([
            'file'      => 'required|file|mimes:pdf|max:20480',
            'tampilan'  => 'required|in:VISIBLE,INVISIBLE',
            'title'     => 'nullable|string|max:255',
        ]);

        $userId   = $request->attributes->get('jwt_user_id');
        $origName = $request->file('file')->getClientOriginalName();
        $filename = 'esign_' . Str::uuid() . '.pdf';
        $path     = "esign/{$userId}/{$filename}";

        Storage::disk('local')->put($path, file_get_contents($request->file('file')->getRealPath()));

        $attachId = (string) Str::uuid();
        DB::table('attachments')->insert([
            'id'         => $attachId,
            'user_id'    => $userId,
            'file_name'  => 'signed_' . $origName,
            'file_path'  => $path,
            'mime_type'   => 'application/pdf',
            'file_size'   => $request->file('file')->getSize(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $docId = (string) Str::uuid();
        DB::table('esign_documents')->insert([
            'id'            => $docId,
            'user_id'       => $userId,
            'title'         => $request->title ?: $origName,
            'original_name' => $origName,
            'attachment_id' => $attachId,
            'tampilan'      => $request->tampilan,
            'signed_at'     => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return response()->json([
            'data' => [
                'id'            => $docId,
                'attachment_id' => $attachId,
                'title'         => $request->title ?: $origName,
                'signed_at'     => now()->toIso8601String(),
            ],
            'message' => 'Dokumen berhasil disimpan',
        ], 201);
    }

        // GET /v1/esign
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $docs   = DB::table('esign_documents')
            ->where('user_id', $userId)
            ->orderByDesc('signed_at')
            ->get();

        return response()->json(['data' => $docs]);
    }

    // GET /v1/esign/{id}/download
    public function download(string $id, Request $request): mixed
    {
        $userId = $request->attributes->get('jwt_user_id');
        $doc    = DB::table('esign_documents')->where('id', $id)->where('user_id', $userId)->first();
        abort_if(!$doc, 404, 'Dokumen tidak ditemukan');

        $attachment = DB::table('attachments')->where('id', $doc->attachment_id)->first();
        abort_if(!$attachment || !Storage::disk('local')->exists($attachment->file_path), 404, 'File tidak ditemukan');

        return response()->download(Storage::disk('local')->path($attachment->file_path), $attachment->file_name);
    }

    // POST /v1/esign/{id}/verify
    public function verify(Request $request, string $id): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $doc    = DB::table('esign_documents')->where('id', $id)->where('user_id', $userId)->first();
        abort_if(!$doc, 404, 'Dokumen tidak ditemukan');

        $attachment = DB::table('attachments')->where('id', $doc->attachment_id)->first();
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
}
