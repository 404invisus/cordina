<?php
namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChangeRequestController extends Controller
{
    private function notifyReviewers(ChangeRequest $cr, string $type): void
    {
        $authUrl  = rtrim(config('services.auth.url', 'http://svc-auth'), '/');
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');

        try {
            // Ambil semua user dengan role kepala_seksi
            $resp  = Http::timeout(5)->get("{$authUrl}/api/v1/internal/users-by-role/kepala_seksi");
            $users = $resp->json('data') ?? [];

            foreach ($users as $user) {
                Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                    'user_id' => $user['id'],
                    'type'    => $type,
                    'payload' => [
                        'cr_id'       => $cr->id,
                        'cr_title'    => $cr->title,
                        'cr_priority' => $cr->priority,
                        'cr_type'     => $cr->change_type,
                    ],
                ]);
            }
        } catch (\Throwable) {}
    }

    private function notifyRequester(ChangeRequest $cr, string $type): void
    {
        $notifUrl = rtrim(config('services.notification.url', 'http://svc-notification'), '/');
        try {
            Http::timeout(5)->post("{$notifUrl}/api/v1/notifications/send", [
                'user_id' => $cr->requester_id,
                'type'    => $type,
                'payload' => [
                    'cr_id'          => $cr->id,
                    'cr_title'       => $cr->title,
                    'reviewer_note'  => $cr->reviewer_note,
                ],
            ]);
        } catch (\Throwable) {}
    }

    // GET /v1/change-requests
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $roles  = (array) ($request->attributes->get('jwt_roles') ?? []);

        $canViewAll = !empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'administrator']));

        $query = ChangeRequest::query()->orderByDesc('created_at');

        if (!$canViewAll) {
            $query->where('requester_id', $userId);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    // POST /v1/change-requests
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'reason'      => 'required|string',
            'impact'      => 'nullable|string',
            'priority'    => 'required|in:low,medium,high,critical',
            'change_type' => 'required|in:normal,emergency,standard',
        ]);

        $data['requester_id'] = $request->attributes->get('jwt_user_id');
        $data['status']       = 'draft';

        $cr = ChangeRequest::create($data);
        return response()->json(['data' => $cr], 201);
    }

    // GET /v1/change-requests/{id}
    public function show(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');
        $roles  = (array) ($request->attributes->get('jwt_roles') ?? []);

        $canView = $cr->requester_id === $userId
            || !empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'administrator']));

        abort_if(!$canView, 403, 'Forbidden');
        return response()->json(['data' => $cr]);
    }

    // PUT /v1/change-requests/{id}
    public function update(Request $request, string $id): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if(!in_array($cr->status, ['draft', 'rejected']), 422, 'Hanya CR berstatus draft atau rejected yang bisa diedit');

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'reason'      => 'sometimes|string',
            'impact'      => 'nullable|string',
            'priority'    => 'sometimes|in:low,medium,high,critical',
            'change_type' => 'sometimes|in:normal,emergency,standard',
        ]);

        $cr->update($data);
        return response()->json(['data' => $cr]);
    }

    // POST /v1/change-requests/{id}/submit
    public function submit(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if(!in_array($cr->status, ['draft', 'rejected']), 422, 'Hanya CR berstatus draft atau rejected yang bisa disubmit');

        $cr->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'reviewer_note'=> null,
        ]);

        $this->notifyReviewers($cr, 'change_request.submitted');
        return response()->json(['data' => $cr]);
    }

    // POST /v1/change-requests/{id}/approve
    public function approve(string $id, Request $request): JsonResponse
    {
        $roles = (array) ($request->attributes->get('jwt_roles') ?? []);
        abort_if(empty(array_intersect($roles, ['kepala_seksi'])), 403, 'Forbidden');

        $cr = ChangeRequest::findOrFail($id);
        abort_if($cr->status !== 'submitted', 422, 'Hanya CR berstatus submitted yang bisa diapprove');

        $cr->update([
            'status'      => 'approved',
            'reviewer_id' => $request->attributes->get('jwt_user_id'),
            'reviewed_at' => now(),
            'reviewer_note' => $request->note ?? null,
        ]);

        $this->notifyRequester($cr, 'change_request.approved');
        return response()->json(['data' => $cr]);
    }

    // POST /v1/change-requests/{id}/reject
    public function reject(Request $request, string $id): JsonResponse
    {
        $roles = (array) ($request->attributes->get('jwt_roles') ?? []);
        abort_if(empty(array_intersect($roles, ['kepala_seksi'])), 403, 'Forbidden');

        $request->validate(['note' => 'required|string']);

        $cr = ChangeRequest::findOrFail($id);
        abort_if($cr->status !== 'submitted', 422, 'Hanya CR berstatus submitted yang bisa direject');

        $cr->update([
            'status'        => 'rejected',
            'reviewer_id'   => $request->attributes->get('jwt_user_id'),
            'reviewed_at'   => now(),
            'reviewer_note' => $request->note,
        ]);

        $this->notifyRequester($cr, 'change_request.rejected');
        return response()->json(['data' => $cr]);
    }

    // DELETE /v1/change-requests/{id}
    public function destroy(string $id, Request $request): JsonResponse
    {
        $cr     = ChangeRequest::findOrFail($id);
        $userId = $request->attributes->get('jwt_user_id');

        abort_if($cr->requester_id !== $userId, 403, 'Forbidden');
        abort_if($cr->status === 'approved', 422, 'CR yang sudah approved tidak bisa dihapus');

        $cr->delete();
        return response()->json(null, 204);
    }
}
