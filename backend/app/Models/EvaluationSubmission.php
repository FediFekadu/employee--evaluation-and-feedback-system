<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvaluationSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_id',
        'student_id',
        'submitted_at',
        'is_anonymous',
        'submission_hash',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'is_anonymous' => 'boolean',
    ];

    /**
     * Boot the model to implement immutability controls.
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates after creation (immutability)
        static::updating(function ($model) {
            // Allow updates only if the record was just created (within 1 minute)
            if ($model->created_at && $model->created_at->diffInMinutes(now()) > 1) {
                throw new \Exception('Evaluation submissions are immutable and cannot be modified after creation.');
            }
        });

        // Prevent deletion of submissions
        static::deleting(function ($model) {
            throw new \Exception('Evaluation submissions cannot be deleted to maintain data integrity.');
        });
    }

    /**
     * Get the evaluation that this submission belongs to.
     */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    /**
     * Get the student who made this submission.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the feedbacks associated with this submission.
     */
    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'submission_id');
    }
}