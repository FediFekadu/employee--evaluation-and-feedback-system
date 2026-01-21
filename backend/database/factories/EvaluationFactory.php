<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Evaluation>
 */
class EvaluationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'teacher_id' => Teacher::factory(),
            'department_id' => function (array $attributes) {
                // Get department_id from the course if it exists
                if (isset($attributes['course_id'])) {
                    $course = Course::find($attributes['course_id']);
                    return $course ? $course->department_id : null;
                }
                return null;
            },
            'academic_year' => $this->faker->year(),
            'semester' => $this->faker->numberBetween(1, 2),
            'year_level' => $this->faker->numberBetween(1, 4),
            'opened_at' => $this->faker->dateTimeBetween('-30 days', '-10 days'),
            'closed_at' => $this->faker->dateTimeBetween('+10 days', '+30 days'),
        ];
    }
}