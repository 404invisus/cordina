<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\ProjectMember;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $service) {}

    protected function authorizeProjectAccess(string $projectId): void
    {
        if ($this->hasRole(['administrator', 'kepala_balai', 'kepala_seksi'])) return;

        $uid = $this->authId();
        abort_if(!$uid, 401, 'Unauthenticated');
        abort_if(
            !\Illuminate\Support\Facades\DB::table('project_members')
                ->where('project_id', $projectId)->where('user_id', $uid)->exists(),
            403, 'Forbidden: bukan anggota project ini'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $projects = $this->service->listForUser($this->authId(), $request->all());
        return response()->json(['data' => ProjectResource::collection($projects)]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->requirePermission('project.create');
        $project = $this->service->create($request->validated(), $this->authId());
        return response()->json(['data' => new ProjectResource($project)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $this->authorizeProjectAccess($id);
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource($project)]);
    }

    public function update(UpdateProjectRequest $request, string $id): JsonResponse
    {
        $this->requirePermission('project.edit');
        $project = $this->service->findOrFail($id);
        return response()->json(['data' => new ProjectResource(
            $this->service->update($project, $request->validated())
        )]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->requirePermission('project.delete');
        $project = $this->service->findOrFail($id);
        $this->service->delete($project);
        return response()->json(null, 204);
    }

    /**
     * Tambah anggota proyek, per orang maupun sekaligus satu grup pengguna.
     * Menerima kombinasi user_id / user_ids[] / group_ids[]; anggota grup
     * diambil dari svc-auth lalu didaftarkan satu per satu, sehingga sesudahnya
     * mereka menjadi anggota biasa yang bisa ditugaskan task dan di-mention.
     */
    public function addMember(Request $request, string $projectId): JsonResponse
    {
        $this->requirePermission('project.manage_members');
        $validated = $request->validate([
            'user_id'     => 'nullable|uuid',
            'user_ids'    => 'nullable|array',
            'user_ids.*'  => 'uuid',
            'group_ids'   => 'nullable|array',
            'group_ids.*' => 'uuid',
            'role'        => 'required|in:manager,scrum_master,member',
        ]);
        $this->service->findOrFail($projectId);

        $userIds = array_merge(
            !empty($validated['user_id']) ? [$validated['user_id']] : [],
            $validated['user_ids'] ?? [],
        );

        $skippedGroups = [];
        foreach ($validated['group_ids'] ?? [] as $groupId) {
            $members = $this->fetchGroupMemberIds($groupId);
            if ($members === null) {
                $skippedGroups[] = $groupId;
                continue;
            }
            $userIds = array_merge($userIds, $members);
        }

        $userIds = array_values(array_unique(array_filter($userIds)));
        abort_if(empty($userIds), 422, 'Tidak ada pengguna yang dipilih');

        $added = [];
        foreach ($userIds as $uid) {
            $added[] = ProjectMember::updateOrCreate(
                ['project_id' => $projectId, 'user_id' => $uid],
                ['role' => $validated['role'], 'joined_at' => now()]
            );
        }

        return response()->json([
            'data'    => $added,
            'added'   => count($added),
            'skipped_groups' => $skippedGroups,
        ], 201);
    }

    /** ID anggota sebuah grup pengguna; null bila grup tidak bisa diambil. */
    private function fetchGroupMemberIds(string $groupId): ?array
    {
        try {
            $authUrl = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
            $res = \Illuminate\Support\Facades\Http::timeout(5)
                ->get("{$authUrl}/api/v1/internal/user-groups/{$groupId}");
            if (!$res->successful()) return null;
            return collect($res->json('data.members') ?? [])->pluck('id')->filter()->values()->all();
        } catch (\Throwable) {
            return null;
        }
    }
}
