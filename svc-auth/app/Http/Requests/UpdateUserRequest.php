<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name'          => 'sometimes|string|max:255',
            'password'           => ['sometimes', 'string', 'confirmed', \App\Rules\StrongPassword::get()],
            'telegram_chat_id'   => 'sometimes|nullable|string',
            'nik'               => 'sometimes|nullable|string|max:20',
            'tte_specimen_url'  => 'sometimes|nullable|string',
            'avatar'             => 'sometimes|nullable|string|url',
            'division'           => 'sometimes|nullable|string|max:100',
            'position'           => 'sometimes|nullable|string|max:100',
            'is_active'          => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return \App\Rules\StrongPassword::messages();
    }
}
