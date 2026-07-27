<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255|not_regex:/[<>]/',
            'email'     => 'required|email|unique:users,email',
            'password'  => ['required', 'string', 'confirmed', \App\Rules\StrongPassword::get()],
            'division'  => 'nullable|string|max:100|not_regex:/[<>]/',
            'position'  => 'nullable|string|max:100|not_regex:/[<>]/',
        ];
    }

    public function messages(): array
    {
        return \App\Rules\StrongPassword::messages();
    }
}
