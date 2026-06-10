<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $admin = User::create([
            'id'                => (string) Str::uuid(),
            'full_name'         => 'Admin',
            'email'             => 'admin@agrawork.com',
            'password'          => Hash::make('N@mamuji13'),
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        $admin->assignRole('administrator');
    }
}
