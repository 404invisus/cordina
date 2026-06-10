<?php
namespace App\Http\Controllers;
use App\Models\Task;
use App\Models\Sprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BoardController extends Controller
{
    public function show(Request $request, string $projectId): JsonResponse
    {
        $query = Task::query();
        if ($request->query('sprint_id')) {
            $query->where('sprint_id', $request->query('sprint_id'));
        } else {
            $sprintIds = Sprint::where('project_id', $projectId)->pluck('id');
            $query->whereIn('sprint_id', $sprintIds);
        }
        $tasks = $query->get();
        return response()->json(['data' => ['tasks' => $tasks]]);
    }
    public function move(Request $request, string $taskId): JsonResponse
    {
        $validated = $request->validate(['status' => 'required|in:todo,in_progress,review,done']);
        $task = Task::findOrFail($taskId);
        $isStaffOnly = empty(array_intersect($this->authRoles(), ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']));
        if ($isStaffOnly) {
            abort_if($task->assignee_id !== $this->authId(), 403, 'Staff hanya bisa memindahkan task milik sendiri');
        }
        $task->update(['status' => $validated['status']]);
        return response()->json(['data' => $task->fresh()]);
    }
}
