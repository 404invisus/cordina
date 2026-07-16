<?php
namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CrAttachmentController extends Controller
{
    // GET /v1/change-requests/{id}/attachments
    public function index(string $crId, Request $request): JsonResponse
    {
        $cr = ChangeRequest::findOrFail($crId);
        $attachments = DB::table('cr_attachments')
            ->where('cr_id', $crId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $attachments]);
    }

    // POST /v1/change-requests/{id}/attachments
    public function store(string $crId, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($crId);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->status === 'approved', 422, 'Tidak bisa menambah lampiran pada CR yang sudah disetujui');

        $request->validate([
            'file' => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,zip,rar,txt,csv',
        ]);

        $file     = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = "cr_attachments/{$crId}/{$filename}";

        Storage::disk('local')->putFileAs("cr_attachments/{$crId}", $file, $filename);

        $id = (string) Str::uuid();
        DB::table('cr_attachments')->insert([
            'id'          => $id,
            'cr_id'       => $crId,
            'uploader_id' => $userId,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['data' => DB::table('cr_attachments')->where('id', $id)->first()], 201);
    }

    // GET /v1/change-requests/{id}/attachments/{attachId}/download
    public function download(string $crId, string $attachId, Request $request): mixed
    {
        $attachment = DB::table('cr_attachments')
            ->where('id', $attachId)
            ->where('cr_id', $crId)
            ->first();

        abort_if(!$attachment, 404, 'Lampiran tidak ditemukan');
        abort_if(!Storage::disk('local')->exists($attachment->file_path), 404, 'File tidak ditemukan');

        return response()->download(
            Storage::disk('local')->path($attachment->file_path),
            $attachment->file_name
        );
    }

    // DELETE /v1/change-requests/{id}/attachments/{attachId}
    public function destroy(string $crId, string $attachId, Request $request): JsonResponse
    {
        $userId     = $request->attributes->get('jwt_user_id');
        $attachment = DB::table('cr_attachments')
            ->where('id', $attachId)
            ->where('cr_id', $crId)
            ->first();

        abort_if(!$attachment, 404, 'Lampiran tidak ditemukan');
        abort_if($attachment->uploader_id !== $userId, 403, 'Hanya pengunggah yang bisa menghapus lampiran');

        Storage::disk('local')->delete($attachment->file_path);
        DB::table('cr_attachments')->where('id', $attachId)->delete();

        return response()->json(null, 204);
    }
}
