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

        // Build signature properties
        $signProps = [[
            'tampilan' => $request->tampilan,
            'page'     => 1,
            'originX'  => 340.0,
            'originY'  => 50.0,
            'width'    => 120.0,
            'height'   => 60.0,
            'location' => 'Jakarta',
            'reason'   => 'Tanda Tangan Elektronik',
        ]];

        // Tambah spesimen jika VISIBLE
        if ($request->tampilan === 'VISIBLE' && $specimenId) {
            $attachment = DB::table('attachments')->where('id', $specimenId)->first();
            if ($attachment && Storage::disk('local')->exists($attachment->file_path)) {
                $specimenB64 = base64_encode(file_get_contents(Storage::disk('local')->path($attachment->file_path)));
                $signProps[0]['imageBase64'] = $specimenB64;
            }
        }

        // Convert PDF ke base64
        $pdfContent = file_get_contents($request->file('file')->getRealPath());

        // Call TTE API
        $tteBase = config('services.tte.base_url', 'https://esign-dev.layanan.go.id');
        $tteUser = config('services.tte.username', 'esign');
        $ttePass = config('services.tte.password', '');
        $tteKey  = config('services.tte.api_key', '');

        $multipart = Http::timeout(60)
            ->withBasicAuth($tteUser, $ttePass)
            ->withHeaders(['x-api-key' => $tteKey])
            ->attach('file', $pdfContent, $request->file('file')->getClientOriginalName())
            ->attach('nik', $nik)
            ->attach('passphrase', $request->passphrase)
            ->attach('tampilan', $request->tampilan);

        if ($request->tampilan === 'VISIBLE') {
            $multipart = $multipart
                ->attach('tag_koordinat', '$')
                ->attach('width', '120')
                ->attach('height', '60');
            if (!empty($signProps[0]['imageBase64'])) {
                $multipart = $multipart->attach('image', base64_decode($signProps[0]['imageBase64']), 'specimen.png');
            }
        }

        $tteResponse = $multipart->post("{$tteBase}/api/sign/pdf");

        abort_if(!$tteResponse->successful(), 422, 'Gagal menandatangani via TTE: ' . ($tteResponse->json('message') ?? $tteResponse->status()));

        $signedPdfB64 = $tteResponse->json('signedFile.0') ?? $tteResponse->json('file.0') ?? null;
        abort_if(!$signedPdfB64, 422, 'Response TTE tidak mengandung file yang ditandatangani');

        // Simpan PDF ter-TTE
        $origName = $request->file('file')->getClientOriginalName();
        $filename = 'esign_' . Str::uuid() . '.pdf';
        $path     = "esign/{$userId}/{$filename}";
        Storage::disk('local')->put($path, base64_decode($signedPdfB64));

        $attachId = (string) Str::uuid();
        DB::table('attachments')->insert([
            'id'          => $attachId,
            'user_id'     => $userId,
            'file_name'   => 'signed_' . $origName,
            'file_path'   => $path,
            'mime_type'   => 'application/pdf',
            'file_size'   => strlen(base64_decode($signedPdfB64)),
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

        $pdfB64 = base64_encode(file_get_contents(Storage::disk('local')->path($attachment->file_path)));

        $tteBase = config('services.tte.base_url', 'https://esign-dev.layanan.go.id');
        $tteUser = config('services.tte.username', 'esign');
        $ttePass = config('services.tte.password', '');
        $tteKey  = config('services.tte.api_key', '');

        $response = Http::timeout(30)
            ->withBasicAuth($tteUser, $ttePass)
            ->withHeaders(['x-api-key' => $tteKey])
            ->post("{$tteBase}/api/v2/verify/pdf", ['file' => $pdfB64]);

        return response()->json(['data' => $response->json()]);
    }
}
