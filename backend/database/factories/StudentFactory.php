<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'student_id' => $this->faker->unique()->numerify('STU######'),
            'year_level' => $this->faker->numberBetween(1, 4),
            'semester' => $this->faker->numberBetween(1, 2),
        ];
    }
}