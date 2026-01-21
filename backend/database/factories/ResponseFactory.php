<?php

namespace Database\Factories;

use App\Models\Response;
use App\Models\Feedback;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Response>
 */
class ResponseFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Response::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'feedback_id' => Feedback::factory(),
            'question_id' => Question::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'text' => $this->faker->optional(0.3)->sentence(), // 30% chance of having text
            'created_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'updated_at' => function (array $attributes) {
                return $attributes['created_at'];
            },
        ];
    }

    /**
     * Indicate that the response has only a rating (no text).
     */
    public function ratingOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'text' => null,
        ]);
    }

    /**
     * Indicate that the response has only text (no rating).
     */
    public function textOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => null,
            'text' => $this->faker->paragraph(),
        ]);
    }

    /**
     * Set a specific rating value.
     */
    public function withRating(int $rating): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => $rating,
        ]);
    }

    /**
     * Set a specific text response.
     */
    public function withText(string $text): static
    {
        return $this->state(fn (array $attributes) => [
            'text' => $text,
        ]);
    }

    /**
     * Associate the response with a specific feedback.
     */
    public function forFeedback(Feedback $feedback): static
    {
        return $this->state(fn (array $attributes) => [
            'feedback_id' => $feedback->id,
        ]);
    }

    /**
     * Associate the response with a specific question.
     */
    public function forQuestion(Question $question): static
    {
        return $this->state(fn (array $attributes) => [
            'question_id' => $question->id,
        ]);
    }

    /**
     * Create a response with excellent rating (5).
     */
    public function excellent(): static
    {
        return $this->withRating(5);
    }

    /**
     * Create a response with good rating (4).
     */
    public function good(): static
    {
        return $this->withRating(4);
    }

    /**
     * Create a response with average rating (3).
     */
    public function average(): static
    {
        return $this->withRating(3);
    }

    /**
     * Create a response with poor rating (2).
     */
    public function poor(): static
    {
        return $this->withRating(2);
    }

    /**
     * Create a response with very poor rating (1).
     */
    public function veryPoor(): static
    {
        return $this->withRating(1);
    }
}