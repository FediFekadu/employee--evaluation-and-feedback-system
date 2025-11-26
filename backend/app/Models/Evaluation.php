<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluation extends Model
{
    protected $fillable = ['course_id', 'teacher_id', 'semester', 'opened_at', 'closed_at'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'evaluation_questions');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }
}