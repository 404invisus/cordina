<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);

        $query = DB::table('activity_logs as al')
            ->leftJoin('users as u', 'al.user_id', '=', 'u.id')
            ->select(
                'al.id', 'al.user_id', 'al.action', 'al.description',
                'al.ip_address', 'al.success', 'al.metadata', 'al.created_at',
                'u.full_name', 'u.email'
            )
            ->orderByDesc('al.created_at');

        if ($request->user_id) {
            $query->where('al.user_id', $request->user_id);
        }
        if ($request->action) {
            $query->where('al.action', $request->action);
        }
        if ($request->from) {
            $query->whereDate('al.created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('al.created_at', '<=', $request->to);
        }
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('u.full_name', 'ilike', '%' . $request->search . '%')
                  ->orWhere('u.email', 'ilike', '%' . $request->search . '%')
                  ->orWhere('al.description', 'ilike', '%' . $request->search . '%');
            });
        }

        $data = $query->paginate(50);

        // Parse metadata JSON
        $data->getCollection()->transform(function ($item) {
            $item->metadata = $item->metadata ? json_decode($item->metadata, true) : null;
            return $item;
        });

        return response()->json(['data' => $data]);
    }

    public function loginHistory(string $userId, Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);

        $logs = DB::table('activity_logs')
            ->where('user_id', $userId)
            ->whereIn('action', ['login', 'logout', 'login_failed'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $logs]);
    }
}
