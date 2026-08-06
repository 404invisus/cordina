<?php
namespace App\Http\Controllers;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorageController extends Controller
{
    public function __construct(private readonly StorageService $service) {}

    public function usage(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->usage($request->attributes->get('jwt_user_id'))]);
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate(['folder_id' => 'nullable|uuid']);
        $userId = $request->attributes->get('jwt_user_id');
        return response()->json(['data' => $this->service->browseOwn($request->query('folder_id'), $userId)]);
    }

    public function shared(Request $request): JsonResponse
    {
        $request->validate(['folder_id' => 'nullable|uuid']);
        $userId = $request->attributes->get('jwt_user_id');
        return response()->json(['data' => $this->service->browseShared($request->query('folder_id'), $userId)]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file'       => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,gif,webp,zip,rar,txt,csv',
            'folder_id'  => 'nullable|uuid',
            'visibility' => 'nullable|in:private,internal',
        ]);

        $result = $this->service->store(
            $request->file('file'),
            $request->input('folder_id'),
            $request->input('visibility'),
            $request->attributes->get('jwt_user_id')
        );

        return response()->json(['data' => $result], 201);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $request->validate([
            'file_name'  => 'nullable|string|max:255',
            'folder_id'  => 'nullable|uuid',
            'visibility' => 'nullable|in:private,internal',
        ]);

        $result = $this->service->updateFile(
            $id,
            $request->attributes->get('jwt_user_id'),
            $request->only(['file_name', 'folder_id', 'visibility'])
        );

        return response()->json(['data' => $result]);
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

    public function storeFolder(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'parent_id'  => 'nullable|uuid',
            'visibility' => 'nullable|in:private,internal',
        ]);

        $result = $this->service->createFolder(
            $request->input('name'),
            $request->input('parent_id'),
            $request->input('visibility'),
            $request->attributes->get('jwt_user_id')
        );

        return response()->json(['data' => $result], 201);
    }

    public function updateFolder(string $id, Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'nullable|string|max:255',
            'parent_id'  => 'nullable|uuid',
            'visibility' => 'nullable|in:private,internal',
        ]);

        $result = $this->service->updateFolder(
            $id,
            $request->attributes->get('jwt_user_id'),
            $request->only(['name', 'parent_id', 'visibility'])
        );

        return response()->json(['data' => $result]);
    }

    public function destroyFolder(string $id, Request $request): JsonResponse
    {
        $this->service->deleteFolder(
            $id,
            $request->attributes->get('jwt_user_id'),
            $request->boolean('force')
        );
        return response()->json(null, 204);
    }
}
