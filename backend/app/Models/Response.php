<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Response extends Model
{
    protected $fillable = ['feedback_id', 'question_id', 'rating', 'text'];

    public function feedback(): BelongsTo
    {
        return $this->belongsTo(Feedback::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}