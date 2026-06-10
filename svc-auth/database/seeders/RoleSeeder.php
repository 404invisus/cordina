<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'administrator',
            'kepala_balai',
            'kepala_seksi',
            'project_manager',
            'scrum_master',
            'staff',
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
        }
    }
}
