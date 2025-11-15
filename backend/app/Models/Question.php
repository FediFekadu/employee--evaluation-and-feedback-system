<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Question extends Model
{
    protected $fillable = ['text', 'type'];

    public function evaluations(): BelongsToMany
    {
        return $this->belongsToMany(Evaluation::class, 'evaluation_questions');
    }
}