<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedbacks';
    protected $fillable = ['evaluation_id', 'student_id', 'anonymous', 'submission_id', 'is_locked'];

    protected $casts = [
        'anonymous' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Boot the model to implement immutability controls for locked feedbacks.
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates to locked feedbacks
        static::updating(function ($model) {
            if ($model->is_locked && $model->isDirty() && !$model->isDirty('is_locked')) {
                throw new \Exception('Locked feedback cannot be modified to maintain data integrity.');
            }
        });

        // Prevent deletion of locked feedbacks
        static::deleting(function ($model) {
            if ($model->is_locked) {
                throw new \Exception('Locked feedback cannot be deleted to maintain data integrity.');
            }
        });
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    /**
     * Get the submission that this feedback belongs to.
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(EvaluationSubmission::class, 'submission_id');
    }
}