<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,archived,completed',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'settings'    => 'nullable|array',
        ];
    }
}
