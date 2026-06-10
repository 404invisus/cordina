<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'           => 'sometimes|string|max:255',
            'description'     => 'nullable|string',
            'status'          => 'sometimes|in:todo,in_progress,review,done',
            'priority'        => 'nullable|in:low,medium,high,critical',
            'severity'        => 'nullable|in:low,medium,high,critical',
            'assignee_id'     => 'nullable|uuid',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours'    => 'nullable|numeric|min:0',
            'due_date'        => 'nullable|date',
            'custom_fields'   => 'nullable|array',
        ];
    }
}
