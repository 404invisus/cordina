<?php

namespace App\Http\Controllers;

use App\Models\Epic;
use App\Models\Story;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index(string $epicId): JsonResponse
    {
        $this->authorizeEpicAccess($epicId);
        $stories = Story::where('epic_id', $epicId)->with('tasks')->get();
        return response()->json(['data' => $stories]);
    }

    public function store(Request $request, string $epicId): JsonResponse
    {
        $epic = Epic::findOrFail($epicId);
        $this->requireProjectManage($epic->project_id, ['scrum_master']);
        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string',
            'sprint_id'       => 'nullable|uuid|exists:sprints,id',
            'story_points'    => 'nullable|integer|min:1|max:100',
            'priority'        => 'nullable|in:low,medium,high,critical',
            'assignee_id'     => 'nullable|uuid',
            'due_date'        => 'nullable|date',
            'estimated_hours' => 'nullable|integer|min:1',
            'type'            => 'nullable|in:story,bug,feature,task',
        ]);
        $story = Story::create(array_merge($validated, ['epic_id' => $epicId]));
        return response()->json(['data' => $story], 201);
    }

    public function show(string $storyId): JsonResponse
    {
        $story = Story::with('tasks')->findOrFail($storyId);
        $this->authorizeEpicAccess($story->epic_id);
        return response()->json(['data' => $story]);
    }

    public function update(Request $request, string $storyId): JsonResponse
    {
        $story = Story::with('epic:id,project_id')->findOrFail($storyId);
        $this->requireProjectManage($story->epic->project_id, ['scrum_master']);
        $validated = $request->validate([
            'title'           => 'sometimes|string|max:255',
            'description'     => 'nullable|string',
            'sprint_id'       => 'nullable|uuid|exists:sprints,id',
            'story_points'    => 'nullable|integer|min:1|max:100',
            'priority'        => 'nullable|in:low,medium,high,critical',
            'status'         => 'sometimes|in:todo,in_progress,done',
            'assignee_id'     => 'nullable|uuid',
            'due_date'        => 'nullable|date',
            'estimated_hours' => 'nullable|integer|min:1',
            'type'            => 'nullable|in:story,bug,feature,task',
        ]);
        $story->update($validated);
        return response()->json(['data' => $story->fresh()]);
    }

    public function destroy(string $storyId): JsonResponse
    {
        $story = Story::with('epic:id,project_id')->findOrFail($storyId);
        $this->requireProjectManage($story->epic->project_id, ['scrum_master']);
        $story->delete();
        return response()->json(null, 204);
    }
}
