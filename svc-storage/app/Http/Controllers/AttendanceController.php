<?php
namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    // Koordinat kantor
    const OFFICE_LAT = -6.303469753337676;
    const OFFICE_LNG = 106.82004853805161;
    const RADIUS_METERS = 200;

    private function calcDistance(float $lat1, float $lng1, float $lat2, float $lng2): int
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng/2) * sin($dLng/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return (int) round($earthRadius * $c);
    }

    private function determineStatus(string $type, string $workMode, string $time, int $distance): string
    {
        if ($workMode === 'cuti')      return 'cuti';
        if ($workMode === 'dinas_luar') return 'dinas_luar';
        if ($workMode === 'wfh')       return 'wfh';

        // WFO - validasi lokasi
        if ($distance > self::RADIUS_METERS) return 'diluar_radius';

        $now   = \Carbon\Carbon::parse($time);
        $dayOfWeek = \Carbon\Carbon::today()->dayOfWeek; // 0=Minggu, 5=Jumat

        if ($type === 'clock_in') {
            // Max 07:45 hadir, lewat = terlambat
            return $now->lte(\Carbon\Carbon::parse('07:45:00')) ? 'hadir' : 'terlambat';
        } else {
            // Clock out
            $minOut = $dayOfWeek === 5
                ? \Carbon\Carbon::parse('16:30:00') // Jumat
                : \Carbon\Carbon::parse('16:00:00'); // Senin-Kamis
            return $now->gte($minOut) ? 'hadir' : 'pulang_cepat';
        }
    }

    // POST /v1/attendance/clock-in
    public function clockIn(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $today  = now()->toDateString();

        // Cek sudah clock-in hari ini
        $existing = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->where('type', 'clock_in')
            ->first();
        if ($existing) {
            return response()->json(['message' => 'Anda sudah clock-in hari ini', 'data' => $existing], 422);
        }

        $workMode = $request->input('work_mode', 'wfo');
        $time     = now()->format('H:i:s');
        $distance = 0;
        $lat      = null;
        $lng      = null;

        if (in_array($workMode, ['wfo'])) {
            $request->validate([
                'latitude'  => 'required|numeric',
                'longitude' => 'required|numeric',
            ]);
            $lat      = $request->latitude;
            $lng      = $request->longitude;
            $distance = $this->calcDistance($lat, $lng, self::OFFICE_LAT, self::OFFICE_LNG);
        }

        $status = $this->determineStatus('clock_in', $workMode, $time, $distance);

        // Handle file upload untuk dinas_luar/cuti
        $filePath = $fileName = $mimeType = null;
        $fileSize = null;
        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $safeName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path     = "attendance/{$safeName}";
            Storage::disk('local')->put($path, file_get_contents($file));
            $filePath  = $path;
            $fileName  = $file->getClientOriginalName();
            $mimeType  = $file->getMimeType();
            $fileSize  = $file->getSize();
        }

        $attendance = Attendance::create([
            'user_id'              => $userId,
            'date'                 => $today,
            'type'                 => 'clock_in',
            'work_mode'            => $workMode,
            'time'                 => $time,
            'latitude'             => $lat,
            'longitude'            => $lng,
            'distance_from_office' => $distance,
            'status'               => $status,
            'file_path'            => $filePath,
            'file_name'            => $fileName,
            'mime_type'            => $mimeType,
            'file_size'            => $fileSize,
            'notes'                => $request->notes,
        ]);

        return response()->json(['data' => $attendance], 201);
    }

    // POST /v1/attendance/clock-out
    public function clockOut(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $today  = now()->toDateString();

        $clockIn = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->where('type', 'clock_in')
            ->first();
        abort_if(!$clockIn, 422, 'Anda belum clock-in hari ini');

        $existing = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->where('type', 'clock_out')
            ->first();
        if ($existing) {
            return response()->json(['message' => 'Anda sudah clock-out hari ini', 'data' => $existing], 422);
        }

        $workMode = $clockIn->work_mode;
        $time     = now()->format('H:i:s');
        $distance = 0;
        $lat      = null;
        $lng      = null;

        if ($workMode === 'wfo') {
            $request->validate([
                'latitude'  => 'required|numeric',
                'longitude' => 'required|numeric',
            ]);
            $lat      = $request->latitude;
            $lng      = $request->longitude;
            $distance = $this->calcDistance($lat, $lng, self::OFFICE_LAT, self::OFFICE_LNG);
        }

        $status = $this->determineStatus('clock_out', $workMode, $time, $distance);

        $attendance = Attendance::create([
            'user_id'              => $userId,
            'date'                 => $today,
            'type'                 => 'clock_out',
            'work_mode'            => $workMode,
            'time'                 => $time,
            'latitude'             => $lat,
            'longitude'            => $lng,
            'distance_from_office' => $distance,
            'status'               => $status,
            'notes'                => $request->notes,
        ]);

        return response()->json(['data' => $attendance], 201);
    }

    // GET /v1/attendance/today
    public function today(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $today  = now()->toDateString();

        $records = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->get();

        $clockIn  = $records->firstWhere('type', 'clock_in');
        $clockOut = $records->firstWhere('type', 'clock_out');

        return response()->json(['data' => [
            'date'      => $today,
            'clock_in'  => $clockIn,
            'clock_out' => $clockOut,
            'can_clock_in'  => !$clockIn,
            'can_clock_out' => $clockIn && !$clockOut,
        ]]);
    }

    // GET /v1/attendance/history
    public function history(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $records = Attendance::where('user_id', $userId)
            ->when($request->from, fn($q, $v) => $q->where('date', '>=', $v))
            ->when($request->to,   fn($q, $v) => $q->where('date', '<=', $v))
            ->orderByDesc('date')
            ->paginate(31);

        return response()->json(['data' => $records]);
    }

    // GET /v1/attendance/report (admin only)
    public function report(Request $request): JsonResponse
    {
        $roles = (array) ($request->attributes->get('jwt_roles') ?? []);
        abort_if(
            empty(array_intersect($roles, ['kepala_balai', 'kepala_seksi', 'administrator'])),
            403, 'Forbidden'
        );

        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $records = Attendance::where('type', 'clock_in')
            ->whereBetween('date', [$request->from, $request->to])
            ->when($request->user_id, fn($q, $v) => $q->where('user_id', $v))
            ->orderBy('date')->orderBy('user_id')
            ->get();

        return response()->json(['data' => $records]);
    }

    // GET /v1/attendance/download/{id}
    public function downloadFile(string $id, Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $rec = Attendance::findOrFail($id);
        abort_if(!$rec->file_path || !Storage::disk('local')->exists($rec->file_path), 404, 'File tidak ditemukan');
        return response()->download(Storage::disk('local')->path($rec->file_path), $rec->file_name);
    }
}
