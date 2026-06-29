<?php
namespace App\Http\Controllers;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $docs = Document::query()
            ->when($request->category, fn($q, $v) => $q->where('category', $v))
            ->when($request->search,   fn($q, $v) => $q->where('title', 'ilike', "%{$v}%"))
            ->when($request->expiring, fn($q) => $q->whereNotNull('expires_at')
                ->where('expires_at', '<=', now()->addDays(30)))
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json(['data' => $docs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'category'    => 'required|string|max:100',
            'doc_number'  => 'nullable|string|max:100',
            'issued_at'   => 'nullable|date',
            'expires_at'  => 'nullable|date|after_or_equal:issued_at',
            'description' => 'nullable|string',
            'file'        => 'nullable|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,gif,webp,zip,txt,csv',
        ]);

        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $safeName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path     = "documents/{$safeName}";
            Storage::disk('local')->put($path, file_get_contents($file));
            $data['file_path']  = $path;
            $data['file_name']  = $file->getClientOriginalName();
            $data['mime_type']  = $file->getMimeType();
            $data['file_size']  = $file->getSize();
        }

        $data['created_by'] = $request->attributes->get('jwt_user_id');
        unset($data['file']);
        return response()->json(['data' => Document::create($data)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Document::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $doc  = Document::findOrFail($id);
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'category'    => 'sometimes|string|max:100',
            'doc_number'  => 'nullable|string|max:100',
            'issued_at'   => 'nullable|date',
            'expires_at'  => 'nullable|date',
            'description' => 'nullable|string',
            'file'        => 'nullable|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,gif,webp,zip,txt,csv',
        ]);

        if ($request->hasFile('file')) {
            if ($doc->file_path) Storage::disk('local')->delete($doc->file_path);
            $file     = $request->file('file');
            $safeName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path     = "documents/{$safeName}";
            Storage::disk('local')->put($path, file_get_contents($file));
            $data['file_path']  = $path;
            $data['file_name']  = $file->getClientOriginalName();
            $data['mime_type']  = $file->getMimeType();
            $data['file_size']  = $file->getSize();
            $data['version']    = $doc->version + 1;
        }

        unset($data['file']);
        $doc->update($data);
        return response()->json(['data' => $doc->fresh()]);
    }

    public function download(string $id): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $doc = Document::findOrFail($id);
        abort_if(!$doc->file_path || !Storage::disk('local')->exists($doc->file_path), 404, 'File tidak ditemukan');
        return response()->download(Storage::disk('local')->path($doc->file_path), $doc->file_name);
    }

    public function destroy(string $id): JsonResponse
    {
        $doc = Document::findOrFail($id);
        if ($doc->file_path) Storage::disk('local')->delete($doc->file_path);
        $doc->delete();
        return response()->json(null, 204);
    }
}
