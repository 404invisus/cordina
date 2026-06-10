<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string',
            'type'            => 'required|in:task,bug,subtask',
            'story_id'        => 'nullable|uuid|exists:stories,id',
            'sprint_id'       => 'nullable|uuid|exists:sprints,id',
            'parent_task_id'  => 'nullable|uuid|exists:tasks,id',
            'priority'        => 'nullable|in:low,medium,high,critical',
            'severity'        => 'nullable|in:low,medium,high,critical',
            'assignee_id'     => 'nullable|uuid',
            'estimated_hours' => 'nullable|numeric|min:0',
            'due_date'        => 'nullable|date',
            'custom_fields'   => 'nullable|array',
        ];
    }
}
