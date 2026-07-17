<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserGroupController extends Controller
{
    // GET /v1/admin/user-groups — semua user bisa lihat
    public function index(): JsonResponse
    {
        $groups = DB::table('user_groups as g')
            ->select('g.*', DB::raw('COUNT(m.id) as member_count'))
            ->leftJoin('user_group_members as m', 'g.id', '=', 'm.group_id')
            ->groupBy('g.id', 'g.name', 'g.description', 'g.telegram_chat_id', 'g.created_by', 'g.created_at', 'g.updated_at')
            ->orderBy('g.name')
            ->get();

        return response()->json(['data' => $groups]);
    }

    // GET /v1/admin/user-groups/{id} — semua user bisa lihat
    public function show(string $id): JsonResponse
    {
        $group = DB::table('user_groups')->where('id', $id)->first();
        abort_if(!$group, 404, 'Group tidak ditemukan');

        $members = DB::table('user_group_members as m')
            ->join('users as u', 'm.user_id', '=', 'u.id')
            ->where('m.group_id', $id)
            ->select('u.id', 'u.full_name', 'u.email')
            ->get();

        return response()->json(['data' => array_merge((array) $group, ['members' => $members])]);
    }

    // POST /v1/admin/user-groups — hanya admin
    public function store(Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        $request->validate([
            'name'             => 'required|string|max:100',
            'description'      => 'nullable|string',
            'telegram_chat_id' => 'nullable|string|max:50',
            'member_ids'       => 'nullable|array',
            'member_ids.*'     => 'uuid',
        ]);

        $id = (string) Str::uuid();
        DB::table('user_groups')->insert([
            'id'               => $id,
            'name'             => $request->name,
            'description'      => $request->description,
            'telegram_chat_id' => $request->telegram_chat_id,
            'created_by'       => $request->attributes->get('jwt_user_id'),
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        foreach ($request->member_ids ?? [] as $userId) {
            DB::table('user_group_members')->insertOrIgnore([
                'id'         => (string) Str::uuid(),
                'group_id'   => $id,
                'user_id'    => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['data' => ['id' => $id], 'message' => 'Group berhasil dibuat'], 201);
    }

    // PUT /v1/admin/user-groups/{id} — hanya admin
    public function update(Request $request, string $id): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        $request->validate([
            'name'             => 'sometimes|string|max:100',
            'description'      => 'nullable|string',
            'telegram_chat_id' => 'nullable|string|max:50',
            'member_ids'       => 'nullable|array',
            'member_ids.*'     => 'uuid',
        ]);

        $group = DB::table('user_groups')->where('id', $id)->first();
        abort_if(!$group, 404, 'Group tidak ditemukan');

        DB::table('user_groups')->where('id', $id)->update([
            'name'             => $request->name ?? $group->name,
            'description'      => $request->description ?? $group->description,
            'telegram_chat_id' => $request->telegram_chat_id ?? $group->telegram_chat_id,
            'updated_at'       => now(),
        ]);

        if ($request->has('member_ids')) {
            DB::table('user_group_members')->where('group_id', $id)->delete();
            foreach ($request->member_ids as $userId) {
                DB::table('user_group_members')->insertOrIgnore([
                    'id'         => (string) Str::uuid(),
                    'group_id'   => $id,
                    'user_id'    => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Group berhasil diupdate']);
    }

    // DELETE /v1/admin/user-groups/{id} — hanya admin
    public function destroy(string $id): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        DB::table('user_groups')->where('id', $id)->delete();
        return response()->json(null, 204);
    }
}
