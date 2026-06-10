<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8|confirmed',
            'division'  => 'nullable|string|max:100',
            'position'  => 'nullable|string|max:100',
        ];
    }
}
