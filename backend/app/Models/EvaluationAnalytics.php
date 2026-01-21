<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_id',
        'total_eligible_students',
        'total_submissions',
        'participation_rate',
        'average_rating',
        'weighted_score',
        'calculated_at',
    ];

    protected $casts = [
        'participation_rate' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'weighted_score' => 'decimal:2',
        'calculated_at' => 'datetime',
    ];

    /**
     * Get the evaluation that these analytics belong to.
     */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }
}