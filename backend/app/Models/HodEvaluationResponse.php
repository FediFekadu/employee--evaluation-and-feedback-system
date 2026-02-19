<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HodEvaluationResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'hod_evaluation_id',
        'hod_template_question_id',
        'rating',
        'text',
    ];

    public function evaluation()
    {
        return $this->belongsTo(HodEvaluation::class, 'hod_evaluation_id');
    }

    public function question()
    {
        return $this->belongsTo(HodTemplateQuestion::class, 'hod_template_question_id');
    }
}
