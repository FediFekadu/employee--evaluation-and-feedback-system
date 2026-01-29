<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeerEvaluationAssignee extends Model
{
    use HasFactory;

    protected $fillable = [
        'peer_evaluation_id',
        'evaluator_teacher_id',
        'invited_at',
        'responded_at',
        'status',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(PeerEvaluation::class, 'peer_evaluation_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'evaluator_teacher_id');
    }
}