<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PeerEvaluationResponse extends Model
{
    use HasFactory;

    protected $table = 'peer_evaluation_responses';

    protected $fillable = [
        'peer_evaluation_id',
        'evaluator_teacher_id',
        'responses',
        'score',
        'submitted_at',
    ];

    protected $casts = [
        'responses' => 'array',
        'submitted_at' => 'datetime',
        'score' => 'float',
    ];

    public function peerEvaluation()
    {
        return $this->belongsTo(PeerEvaluation::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(Teacher::class, 'evaluator_teacher_id');
    }
}