<?php
namespace App\Http\Controllers;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorageController extends Controller
{
    public function __construct(private readonly StorageService $service) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('jwt_user_id');
        $files = \Illuminate\Support\Facades\DB::table('attachments')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['data' => $files]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file'       => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,gif,webp,zip,rar,txt,csv',
            'entity_id'  => 'nullable|string',
            'entity_type'=> 'nullable|string',
        ]);

        $result = $this->service->store(
            $request->file('file'),
            $request->entity_type ?? 'general',
            $request->entity_id ?? 'general',
            $request->attributes->get('jwt_user_id')
        );

        return response()->json(['data' => $result], 201);
    }

    public function download(string $id, Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        return $this->service->download($id, $request->attributes->get('jwt_user_id'));
    }

    public function destroy(string $id, Request $request): JsonResponse
    {
        $this->service->delete($id, $request->attributes->get('jwt_user_id'));
        return response()->json(null, 204);
    }
}
