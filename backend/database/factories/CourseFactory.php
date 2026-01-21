<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'title' => $this->faker->words(3, true),
            'code' => strtoupper($this->faker->lexify('???')) . $this->faker->numberBetween(100, 999),
            'description' => $this->faker->sentence(),
        ];
    }
}