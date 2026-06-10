<?php

namespace App\Http\Controllers;

use App\Models\Epic;
use App\Models\Sprint;
use Illuminate\Http\JsonResponse;

class RoadmapController extends Controller
{
    public function show(string $projectId): JsonResponse
    {
        $epics = Epic::where('project_id', $projectId)->with('stories')->get()
            ->map(fn($e) => [
                'id' => $e->id, 'title' => $e->title, 'color' => $e->color,
                'start_date' => $e->start_date, 'end_date' => $e->end_date,
                'status' => $e->status, 'story_count' => $e->stories->count(),
            ]);
        $sprints = Sprint::where('project_id', $projectId)->get()
            ->map(fn($s) => [
                'id' => $s->id, 'name' => $s->name,
                'start_date' => $s->start_date, 'end_date' => $s->end_date, 'status' => $s->status,
            ]);
        return response()->json(['data' => ['epics' => $epics, 'sprints' => $sprints]]);
    }
}
