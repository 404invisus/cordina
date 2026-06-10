<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreSprintRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'       => 'required|string|max:255',
            'goal'       => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ];
    }
}
