<?php

namespace Database\Factories;

use App\Models\EvaluationSubmission;
use App\Models\Evaluation;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationSubmissionFactory extends Factory
{
    protected $model = EvaluationSubmission::class;

    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'student_id' => Student::factory(),
            'submitted_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'is_anonymous' => $this->faker->boolean(80), // 80% chance of being anonymous
            'submission_hash' => hash('sha256', $this->faker->uuid() . time()),
        ];
    }
}