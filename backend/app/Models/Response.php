<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Response extends Model
{
    use HasFactory;

    protected $fillable = ['feedback_id', 'question_id', 'rating', 'text'];

    /**
     * Boot the model to implement immutability controls for responses in locked feedbacks.
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates to responses in locked feedbacks
        static::updating(function ($model) {
            if ($model->feedback && $model->feedback->is_locked) {
                throw new \Exception('Responses in locked feedback cannot be modified to maintain data integrity.');
            }
        });

        // Prevent deletion of responses in locked feedbacks
        static::deleting(function ($model) {
            if ($model->feedback && $model->feedback->is_locked) {
                throw new \Exception('Responses in locked feedback cannot be deleted to maintain data integrity.');
            }
        });
    }

    public function feedback(): BelongsTo
    {
        return $this->belongsTo(Feedback::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}