<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'Computer Science', 'code' => 'CS'],
            ['name' => 'Information Systems', 'code' => 'IS'],
            ['name' => 'Software Engineering', 'code' => 'SE'],
            ['name' => 'Information Technology', 'code' => 'IT'],
            ['name' => 'Information Science', 'code' => 'IC'],
            ['name' => 'Computer Science and Engineering', 'code' => 'CSE'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['code' => $dept['code']], $dept);
        }
    }
}