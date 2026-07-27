<?php

namespace App\Rules;

use Illuminate\Validation\Rules\Password;

class StrongPassword
{
    public static function get(): Password
    {
        return Password::min(12)->mixedCase()->numbers()->symbols();
    }

    public static function messages(): array
    {
        return [
            'password.min'     => 'Password minimal 12 karakter.',
            'password.mixed'   => 'Password harus mengandung huruf besar dan huruf kecil.',
            'password.numbers' => 'Password harus mengandung minimal 1 angka.',
            'password.symbols'   => 'Password harus mengandung minimal 1 simbol.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'current_password.required' => 'Password saat ini wajib diisi.',
        ];
    }
}
