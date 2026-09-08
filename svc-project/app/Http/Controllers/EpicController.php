<?php

namespace App\Http\Controllers;

use App\Models\Epic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EpicController extends Controller
{
    public function index(string $projectId): JsonResponse
    {
        $this->authorizeProjectAccess($projectId);
        $epics = Epic::where('project_id', $projectId)->withCount('stories')->get();
        return response()->json(['data' => $epics]);
    }

    public function store(Request $request, string $projectId): JsonResponse
    {
        $this->requireProjectManage($projectId);
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
        $this->authorizeProjectAccess($epic->project_id);
        return response()->json(['data' => $epic]);
    }

    public function update(Request $request, string $epicId): JsonResponse
    {
        $epic = Epic::findOrFail($epicId);
        $this->requireProjectManage($epic->project_id);
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
        $epic = Epic::findOrFail($epicId);
        $this->requireProjectManage($epic->project_id);
        $epic->delete();
        return response()->json(null, 204);
    }
}
