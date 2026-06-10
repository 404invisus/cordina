<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index(string $epicId): JsonResponse
    {
        $stories = Story::where('epic_id', $epicId)->with('tasks')->get();
        return response()->json(['data' => $stories]);
    }

    public function store(Request $request, string $epicId): JsonResponse
    {
        $this->requireRole(['kepala_seksi', 'project_manager', 'scrum_master']);
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'sprint_id'    => 'nullable|uuid|exists:sprints,id',
            'story_points' => 'nullable|integer|min:1|max:100',
            'priority'     => 'nullable|in:low,medium,high,critical',
        ]);
        $story = Story::create(array_merge($validated, ['epic_id' => $epicId]));
        return response()->json(['data' => $story], 201);
    }

    public function show(string $storyId): JsonResponse
    {
        $story = Story::with('tasks')->findOrFail($storyId);
        return response()->json(['data' => $story]);
    }

    public function update(Request $request, string $storyId): JsonResponse
    {
        $this->requireRole(['kepala_seksi', 'project_manager', 'scrum_master']);
        $story = Story::findOrFail($storyId);
        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'sprint_id'    => 'nullable|uuid|exists:sprints,id',
            'story_points' => 'nullable|integer|min:1|max:100',
            'priority'     => 'nullable|in:low,medium,high,critical',
            'status'       => 'sometimes|in:todo,in_progress,done',
        ]);
        $story->update($validated);
        return response()->json(['data' => $story->fresh()]);
    }

    public function destroy(string $storyId): JsonResponse
    {
        $this->requireRole(['kepala_seksi', 'project_manager', 'scrum_master']);
        Story::findOrFail($storyId)->delete();
        return response()->json(null, 204);
    }
}
