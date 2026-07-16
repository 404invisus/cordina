<?php
namespace App\Http\Controllers;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $assets = Asset::query()
            ->when($request->category, fn($q, $v) => $q->where('category', $v))
            ->when($request->condition, fn($q, $v) => $q->where('condition', $v))
            ->when($request->search,   fn($q, $v) => $q->where('name', 'ilike', "%{$v}%"))
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json(['data' => $assets]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                => 'required|string|max:255',
            'category'            => 'required|string|max:100',
            'serial_number'       => 'nullable|string|max:100',
            'condition'           => 'required|in:baik,rusak_ringan,rusak_berat',
            'location'            => 'nullable|string|max:255',
            'acquired_at'         => 'nullable|date',
            'value'               => 'nullable|numeric|min:0',
            'responsible_user_id' => 'nullable|string',
            'notes'               => 'nullable|string',
        ]);
        $data['created_by'] = $request->attributes->get('jwt_user_id');
        $asset = Asset::create($data);
        \App\Services\ActivityLogger::log($data['created_by'], 'asset.created', "Tambah aset: {$asset->name}", true, ['asset_id' => $asset->id]);
        return response()->json(['data' => $asset], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Asset::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $asset = Asset::findOrFail($id);
        abort_if($asset->created_by !== $request->attributes->get('jwt_user_id'), 403, 'Hanya pembuat aset yang bisa mengedit');
        $data  = $request->validate([
            'name'                => 'sometimes|string|max:255',
            'category'            => 'sometimes|string|max:100',
            'serial_number'       => 'nullable|string|max:100',
            'condition'           => 'sometimes|in:baik,rusak_ringan,rusak_berat',
            'location'            => 'nullable|string|max:255',
            'acquired_at'         => 'nullable|date',
            'value'               => 'nullable|numeric|min:0',
            'responsible_user_id' => 'nullable|string',
            'notes'               => 'nullable|string',
        ]);
        $asset->update($data);
        return response()->json(['data' => $asset->fresh()]);
    }

    public function destroy(string $id, \Illuminate\Http\Request $request): JsonResponse
    {
        $asset = Asset::findOrFail($id);
        abort_if($asset->created_by !== $request->attributes->get('jwt_user_id'), 403, 'Hanya pembuat aset yang bisa menghapus');
        $asset->delete();
        return response()->json(null, 204);
    }
}
