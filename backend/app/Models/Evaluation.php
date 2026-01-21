<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = ['course_id', 'teacher_id', 'department_id', 'academic_year', 'semester', 'year_level', 'opened_at', 'closed_at', 'last_modified_at', 'last_modified_by'];

    protected $casts = [
        'opened_at' => 'date',
        'closed_at' => 'date',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'evaluation_questions');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    /**
     * Get the submissions for this evaluation.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(EvaluationSubmission::class);
    }

    /**
     * Get the analytics for this evaluation.
     */
    public function analytics(): HasOne
    {
        return $this->hasOne(EvaluationAnalytics::class);
    }

    /**
     * Ensure this evaluation has questions from the department template
     */
    public function ensureQuestionsFromTemplate()
    {
        // Check if evaluation already has questions
        if ($this->questions()->count() > 0) {
            return;
        }

        // Get department template
        $template = DepartmentEvaluationTemplate::getActiveTemplate($this->course->department_id);
        if (!$template) {
            return;
        }

        // Create questions from template
        foreach ($template->questions as $templateQuestion) {
            $question = Question::create([
                'text' => $templateQuestion->text,
                'type' => $templateQuestion->type,
                'section' => $templateQuestion->section,
            ]);

            // Attach question to evaluation
            $this->questions()->attach($question->id, [
                'order' => $templateQuestion->order
            ]);
        }
    }

    /**
     * Get questions with template fallback
     */
    public function getQuestionsWithTemplate()
    {
        // First try to get existing questions
        $questions = $this->questions;
        
        if ($questions->count() > 0) {
            return $questions;
        }

        // Fallback to department template questions
        $template = DepartmentEvaluationTemplate::getActiveTemplate($this->course->department_id);
        if (!$template) {
            return collect();
        }

        return $template->questions;
    }
}