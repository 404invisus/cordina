<?php

namespace App\Http\Controllers;

use App\Models\Epic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EpicController extends Controller
{
    public function index(string $projectId): JsonResponse
    {
        $epics = Epic::where('project_id', $projectId)->withCount('stories')->get();
        return response()->json(['data' => $epics]);
    }

    public function store(Request $request, string $projectId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);
        $epic = Epic::create(array_merge($validated, ['project_id' => $projectId]));
        return response()->json(['data' => $epic], 201);
    }

    public function show(string $epicId): JsonResponse
    {
        $epic = Epic::with('stories')->findOrFail($epicId);
        return response()->json(['data' => $epic]);
    }

    public function update(Request $request, string $epicId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        $epic = Epic::findOrFail($epicId);
        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'status'      => 'sometimes|in:todo,in_progress,done',
        ]);
        $epic->update($validated);
        return response()->json(['data' => $epic->fresh()]);
    }

    public function destroy(string $epicId): JsonResponse
    {
        $this->requireRole(['kepala_balai', 'kepala_seksi', 'project_manager']);
        Epic::findOrFail($epicId)->delete();
        return response()->json(null, 204);
    }
}
