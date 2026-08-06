<?php
namespace App\Services;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageService
{
    private const VISIBILITIES = ['private', 'internal'];
    private const MAX_DEPTH = 100;

    /**
     * Walk up the folder chain to resolve the effective visibility of a folder.
     * null $folderId means "root" (no parent folder) -> default 'private'.
     */
    public function effectiveFolderVisibility(?string $folderId): string
    {
        $depth = 0;
        while ($folderId !== null && $depth < self::MAX_DEPTH) {
            $folder = DB::table('folders')->where('id', $folderId)->first();
            if (!$folder) return 'private';
            if ($folder->visibility !== null) return $folder->visibility;
            $folderId = $folder->parent_id;
            $depth++;
        }
        return 'private';
    }

    /** Effective visibility of a file: its own override, else its folder's effective visibility. */
    public function effectiveFileVisibility(object $file): string
    {
        if ($file->visibility !== null) return $file->visibility;
        return $this->effectiveFolderVisibility($file->folder_id);
    }

    private function canRead(string $ownerId, string $effectiveVisibility, string $currentUserId): bool
    {
        if ($ownerId === $currentUserId) return true;
        return $effectiveVisibility === 'internal';
    }

    /** Used when BROWSING "My Storage" — that tree is strictly your own. */
    private function assertOwnFolder(?string $folderId, string $userId): ?object
    {
        if ($folderId === null) return null;
        $folder = DB::table('folders')->where('id', $folderId)->first();
        abort_if(!$folder, 404, 'Folder tidak ditemukan');
        abort_if($folder->owner_id !== $userId, 403, 'Anda tidak punya akses ke folder ini');
        return $folder;
    }

    /**
     * Used when PLACING a new/moved item into a folder (upload, create subfolder, move).
     * Your own folders are always writable; other people's folders are writable too as
     * long as the folder's effective visibility is 'internal' — internal folders are
     * collaborative, anyone signed in can contribute to them.
     */
    private function assertCanWriteInto(?string $folderId, string $userId): ?object
    {
        if ($folderId === null) return null;
        $folder = DB::table('folders')->where('id', $folderId)->first();
        abort_if(!$folder, 404, 'Folder tidak ditemukan');
        $canWrite = $folder->owner_id === $userId || $this->effectiveFolderVisibility($folderId) === 'internal';
        abort_if(!$canWrite, 403, 'Anda tidak punya akses tulis ke folder ini');
        return $folder;
    }

    // ---------------------------------------------------------------------
    // Own storage browsing
    // ---------------------------------------------------------------------

    public function usage(string $userId): array
    {
        $row = DB::table('attachments')
            ->where('user_id', $userId)
            ->selectRaw('COALESCE(SUM(file_size), 0) as total_bytes, COUNT(*) as file_count')
            ->first();

        return ['total_bytes' => (int) $row->total_bytes, 'file_count' => (int) $row->file_count];
    }

    public function browseOwn(?string $folderId, string $userId): array
    {
        $this->assertOwnFolder($folderId, $userId);

        // Root is strictly personal (only your own top-level items). Inside a folder
        // you own, show everything in it — internal folders are collaborative, so
        // other people's contributions belong there too and you should see them.
        if ($folderId === null) {
            $folders = DB::table('folders')->where('owner_id', $userId)->whereNull('parent_id')->orderBy('name')->get();
            $files   = DB::table('attachments')->where('user_id', $userId)->whereNull('folder_id')->orderByDesc('created_at')->get();
        } else {
            $folders = DB::table('folders')->where('parent_id', $folderId)->orderBy('name')->get();
            $files   = DB::table('attachments')->where('folder_id', $folderId)->orderByDesc('created_at')->get();
        }

        return [
            'folders'    => $this->presentSharedFolders($folders),
            'files'      => $this->presentSharedFiles($files),
            'breadcrumb' => $this->breadcrumb($folderId),
        ];
    }

    // ---------------------------------------------------------------------
    // Cross-user "internal/shared" browsing
    // ---------------------------------------------------------------------

    public function browseShared(?string $folderId, string $currentUserId): array
    {
        if ($folderId === null) {
            $folders = DB::table('folders')
                ->whereNull('parent_id')
                ->where('visibility', 'internal')
                ->orderBy('name')
                ->get();

            $files = DB::table('attachments')
                ->whereNull('folder_id')
                ->where('visibility', 'internal')
                ->orderByDesc('created_at')
                ->get();

            return [
                'folders'    => $this->presentSharedFolders($folders),
                'files'      => $this->presentSharedFiles($files),
                'breadcrumb' => [],
            ];
        }

        $target = DB::table('folders')->where('id', $folderId)->first();
        abort_if(!$target, 404, 'Folder tidak ditemukan');

        $targetEffective = $this->effectiveFolderVisibility($folderId);
        abort_if(
            $target->owner_id !== $currentUserId && $targetEffective !== 'internal',
            403,
            'Folder ini tidak dibagikan'
        );

        $folders = DB::table('folders')->where('parent_id', $folderId)->orderBy('name')->get()
            ->filter(fn($f) => $f->owner_id === $currentUserId || ($f->visibility ?? $targetEffective) === 'internal');

        $files = DB::table('attachments')->where('folder_id', $folderId)->orderByDesc('created_at')->get()
            ->filter(fn($f) => $f->user_id === $currentUserId || ($f->visibility ?? $targetEffective) === 'internal');

        return [
            'folders'    => $this->presentSharedFolders($folders),
            'files'      => $this->presentSharedFiles($files),
            'breadcrumb' => $this->breadcrumb($folderId),
        ];
    }

    private function presentSharedFolders($folders): array
    {
        $names = $this->resolveUserNames($folders->pluck('owner_id')->unique()->all());
        return $folders->map(function ($f) use ($names) {
            $p = $this->presentFolder($f);
            $p['owner_name'] = $names[$f->owner_id] ?? null;
            return $p;
        })->all();
    }

    private function presentSharedFiles($files): array
    {
        $names = $this->resolveUserNames($files->pluck('user_id')->unique()->all());
        return $files->map(function ($f) use ($names) {
            $p = $this->presentFile($f);
            $p['owner_name'] = $names[$f->user_id] ?? null;
            return $p;
        })->all();
    }

    private function breadcrumb(?string $folderId): array
    {
        $trail = [];
        $depth = 0;
        while ($folderId !== null && $depth < self::MAX_DEPTH) {
            $folder = DB::table('folders')->where('id', $folderId)->first();
            if (!$folder) break;
            array_unshift($trail, ['id' => $folder->id, 'name' => $folder->name]);
            $folderId = $folder->parent_id;
            $depth++;
        }
        return $trail;
    }

    /** @return array<string,string> map of user_id => full_name */
    private function resolveUserNames(array $userIds): array
    {
        $userIds = array_values(array_filter($userIds));
        if (empty($userIds)) return [];

        try {
            $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
            $response = Http::timeout(3)->post("{$authUrl}/api/v1/internal/users/batch", ['ids' => $userIds]);
            $users    = collect($response->json('data', []));
            return $users->pluck('full_name', 'id')->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function presentFolder(object $f): array
    {
        return [
            'id'                   => $f->id,
            'name'                 => $f->name,
            'parent_id'            => $f->parent_id,
            'owner_id'             => $f->owner_id,
            'visibility'           => $f->visibility,
            'effective_visibility' => $f->visibility ?? $this->effectiveFolderVisibility($f->parent_id),
            'type'                 => 'folder',
            'created_at'           => $f->created_at,
            'updated_at'           => $f->updated_at,
        ];
    }

    private function presentFile(object $f): array
    {
        return [
            'id'                   => $f->id,
            'file_name'            => $f->file_name,
            'folder_id'            => $f->folder_id,
            'user_id'              => $f->user_id,
            'mime_type'            => $f->mime_type,
            'file_size'            => $f->file_size,
            'visibility'           => $f->visibility,
            'effective_visibility' => $this->effectiveFileVisibility($f),
            'type'                 => 'file',
            'created_at'           => $f->created_at,
            'updated_at'           => $f->updated_at,
        ];
    }

    // ---------------------------------------------------------------------
    // Folder mutations
    // ---------------------------------------------------------------------

    public function createFolder(string $name, ?string $parentId, ?string $visibility, string $userId): array
    {
        $this->assertCanWriteInto($parentId, $userId);
        abort_if($visibility !== null && !in_array($visibility, self::VISIBILITIES, true), 422, 'Visibilitas tidak valid');

        $record = [
            'id'         => (string) Str::uuid(),
            'name'       => $name,
            'parent_id'  => $parentId,
            'owner_id'   => $userId,
            'visibility' => $visibility,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        DB::table('folders')->insert($record);
        return $this->presentFolder((object) $record);
    }

    public function updateFolder(string $id, string $userId, array $fields): array
    {
        $folder = DB::table('folders')->where('id', $id)->first();
        abort_if(!$folder, 404, 'Folder tidak ditemukan');
        abort_if($folder->owner_id !== $userId, 403, 'Hanya pemilik yang bisa mengubah folder ini');

        $update = ['updated_at' => now()];

        if (array_key_exists('name', $fields) && $fields['name'] !== null) {
            $update['name'] = $fields['name'];
        }

        if (array_key_exists('visibility', $fields)) {
            abort_if(
                $fields['visibility'] !== null && !in_array($fields['visibility'], self::VISIBILITIES, true),
                422, 'Visibilitas tidak valid'
            );
            $update['visibility'] = $fields['visibility'];
        }

        if (array_key_exists('parent_id', $fields)) {
            $newParentId = $fields['parent_id'];
            if ($newParentId !== null) {
                $this->assertCanWriteInto($newParentId, $userId);
                abort_if($this->wouldCreateCycle($id, $newParentId), 422, 'Tidak bisa memindahkan folder ke dalam dirinya sendiri');
            }
            $update['parent_id'] = $newParentId;
        }

        DB::table('folders')->where('id', $id)->update($update);
        return $this->presentFolder((object) array_merge((array) $folder, $update));
    }

    private function wouldCreateCycle(string $folderId, string $targetParentId): bool
    {
        $current = $targetParentId;
        $depth   = 0;
        while ($current !== null && $depth < self::MAX_DEPTH) {
            if ($current === $folderId) return true;
            $parent = DB::table('folders')->where('id', $current)->value('parent_id');
            $current = $parent;
            $depth++;
        }
        return false;
    }

    public function deleteFolder(string $id, string $userId, bool $force): void
    {
        $folder = DB::table('folders')->where('id', $id)->first();
        abort_if(!$folder, 404, 'Folder tidak ditemukan');
        abort_if($folder->owner_id !== $userId, 403, 'Hanya pemilik yang bisa menghapus folder ini');

        $folderIds = $this->collectDescendantFolderIds($id);
        $allFolderIds = array_merge([$id], $folderIds);

        $files = DB::table('attachments')->whereIn('folder_id', $allFolderIds)->get();
        $subfolderCount = count($folderIds);

        abort_if(
            !$force && ($files->isNotEmpty() || $subfolderCount > 0),
            409,
            "Folder berisi {$files->count()} berkas dan {$subfolderCount} subfolder. Konfirmasi untuk menghapus semuanya."
        );

        foreach ($files as $file) {
            Storage::disk('local')->delete($file->file_path);
        }

        // FK ON DELETE CASCADE removes subfolder rows and attachment rows automatically.
        DB::table('folders')->where('id', $id)->delete();
    }

    private function collectDescendantFolderIds(string $folderId): array
    {
        $result = [];
        $queue  = [$folderId];
        $depth  = 0;
        while (!empty($queue) && $depth < self::MAX_DEPTH) {
            $children = DB::table('folders')->whereIn('parent_id', $queue)->pluck('id')->all();
            if (empty($children)) break;
            $result = array_merge($result, $children);
            $queue  = $children;
            $depth++;
        }
        return $result;
    }

    // ---------------------------------------------------------------------
    // File operations
    // ---------------------------------------------------------------------

    public function store(UploadedFile $file, ?string $folderId, ?string $visibility, string $userId): array
    {
        $this->assertCanWriteInto($folderId, $userId);
        abort_if($visibility !== null && !in_array($visibility, self::VISIBILITIES, true), 422, 'Visibilitas tidak valid');

        $ext      = $file->getClientOriginalExtension();
        $safeName = Str::uuid() . '.' . $ext;
        $path     = "general/" . ($folderId ?? 'root') . "/{$safeName}";

        Storage::disk('local')->put($path, file_get_contents($file));

        $record = [
            'id'          => (string) Str::uuid(),
            'task_id'     => null,
            'user_id'     => $userId,
            'folder_id'   => $folderId,
            'visibility'  => $visibility,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ];

        DB::table('attachments')->insert($record);
        return $this->presentFile((object) $record);
    }

    public function updateFile(string $id, string $userId, array $fields): array
    {
        $file = DB::table('attachments')->where('id', $id)->first();
        abort_if(!$file, 404, 'Berkas tidak ditemukan');
        abort_if($file->user_id !== $userId, 403, 'Hanya pengunggah yang bisa mengubah berkas ini');

        $update = ['updated_at' => now()];

        if (array_key_exists('file_name', $fields) && $fields['file_name'] !== null) {
            $update['file_name'] = $fields['file_name'];
        }

        if (array_key_exists('visibility', $fields)) {
            abort_if(
                $fields['visibility'] !== null && !in_array($fields['visibility'], self::VISIBILITIES, true),
                422, 'Visibilitas tidak valid'
            );
            $update['visibility'] = $fields['visibility'];
        }

        if (array_key_exists('folder_id', $fields)) {
            $this->assertCanWriteInto($fields['folder_id'], $userId);
            $update['folder_id'] = $fields['folder_id'];
        }

        DB::table('attachments')->where('id', $id)->update($update);
        return $this->presentFile((object) array_merge((array) $file, $update));
    }

    public function download(string $id, string $userId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $file = DB::table('attachments')->where('id', $id)->firstOrFail();
        $effective = $this->effectiveFileVisibility($file);
        abort_if(!$this->canRead($file->user_id, $effective, $userId), 403, 'Anda tidak punya akses ke file ini');
        abort_if(!Storage::disk('local')->exists($file->file_path), 404, 'File not found');
        return response()->download(Storage::disk('local')->path($file->file_path), $file->file_name);
    }

    public function delete(string $id, string $userId): void
    {
        $file = DB::table('attachments')->where('id', $id)->firstOrFail();
        abort_if($file->user_id !== $userId, 403, 'Hanya pengunggah yang bisa menghapus file');
        Storage::disk('local')->delete($file->file_path);
        DB::table('attachments')->where('id', $id)->delete();
    }
}
