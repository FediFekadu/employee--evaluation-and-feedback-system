<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Department;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure a department exists to associate with college admin
        $department = Department::first();

        // Normalize any existing superadmin users to college_admin
        User::where('role', 'superadmin')->update(['role' => 'college_admin']);

        // Seed College Admin (department-level)
        User::updateOrCreate(
            ['email' => 'admin@college.local'],
            [
                'name' => 'College Admin',
                'password' => Hash::make('Admin@1234'),
                'role' => 'college_admin',
                'department_id' => $department?->id,
            ]
        );

        // Seed requested College Admin account
        User::updateOrCreate(
            ['email' => 'collegeadmin@gmail.com'],
            [
                'name' => 'College Admin',
                'password' => Hash::make('12345678'),
                'role' => 'college_admin',
                'department_id' => $department?->id,
            ]
        );
    }
}