<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class UserFactory extends Factory
{
    public function definition(): array
    {
        $faker = Faker::create();

        return [
            'id'                => (string) Str::uuid(),
            'full_name'         => $faker->name(),
            'email'             => $faker->unique()->safeEmail(),
            'password'          => Hash::make('password'),
            'telegram_chat_id'  => null,
            'avatar'            => null,
            'division'          => $faker->randomElement(['IT', 'Finance', 'Operations']),
            'position'          => $faker->jobTitle(),
            'is_active'         => true,
            'email_verified_at' => now(),
        ];
    }
}
