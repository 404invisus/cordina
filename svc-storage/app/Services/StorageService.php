<?php
namespace App\Services;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageService
{
    public function store(UploadedFile $file, string $entityType, string $entityId, string $userId): array
    {
        $ext      = $file->getClientOriginalExtension();
        $safeName = Str::uuid() . '.' . $ext;
        $path     = "{$entityType}/{$entityId}/{$safeName}";

        Storage::disk('local')->put($path, file_get_contents($file));

        $record = [
            'id'          => (string) Str::uuid(),
            'task_id'     => $entityType === 'task' ? $entityId : null,
            'user_id'     => $userId,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ];

        DB::table('attachments')->insert($record);
        return $record;
    }

    public function download(string $id, string $userId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $file = DB::table('attachments')->where('id', $id)->firstOrFail();
        abort_if(!Storage::disk('local')->exists($file->file_path), 404, 'File not found');
        return response()->download(Storage::disk('local')->path($file->file_path), $file->file_name);
    }

    public function delete(string $id, string $userId): void
    {
        $file = DB::table('attachments')->where('id', $id)->firstOrFail();
        Storage::disk('local')->delete($file->file_path);
        DB::table('attachments')->where('id', $id)->delete();
    }
}
