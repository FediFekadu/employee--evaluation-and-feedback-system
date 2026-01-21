<?php

namespace Database\Factories;

use App\Models\Feedback;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\EvaluationSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Feedback>
 */
class FeedbackFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Feedback::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'student_id' => Student::factory(),
            'anonymous' => $this->faker->boolean(70), // 70% chance of being anonymous
            'submission_id' => null, // Will be set if needed
            'is_locked' => $this->faker->boolean(80), // 80% chance of being locked (completed)
            'created_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'updated_at' => function (array $attributes) {
                return $attributes['created_at'];
            },
        ];
    }

    /**
     * Indicate that the feedback is anonymous.
     */
    public function anonymous(): static
    {
        return $this->state(fn (array $attributes) => [
            'anonymous' => true,
        ]);
    }

    /**
     * Indicate that the feedback is identified (not anonymous).
     */
    public function identified(): static
    {
        return $this->state(fn (array $attributes) => [
            'anonymous' => false,
        ]);
    }

    /**
     * Indicate that the feedback is locked (completed).
     */
    public function locked(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_locked' => true,
        ]);
    }

    /**
     * Indicate that the feedback is unlocked (in progress).
     */
    public function unlocked(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_locked' => false,
        ]);
    }

    /**
     * Associate the feedback with a specific evaluation.
     */
    public function forEvaluation(Evaluation $evaluation): static
    {
        return $this->state(fn (array $attributes) => [
            'evaluation_id' => $evaluation->id,
        ]);
    }

    /**
     * Associate the feedback with a specific student.
     */
    public function forStudent(Student $student): static
    {
        return $this->state(fn (array $attributes) => [
            'student_id' => $student->id,
        ]);
    }

    /**
     * Associate the feedback with a specific submission.
     */
    public function forSubmission(EvaluationSubmission $submission): static
    {
        return $this->state(fn (array $attributes) => [
            'submission_id' => $submission->id,
            'evaluation_id' => $submission->evaluation_id,
            'student_id' => $submission->student_id,
        ]);
    }
}