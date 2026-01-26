<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HodTemplateQuestion extends Model
{
    use HasFactory;

    protected $table = 'hod_template_questions';

    protected $fillable = [
        'template_id',
        'text',
        'type',
        'section',
        'order',
    ];

    public function template()
    {
        return $this->belongsTo(DepartmentHodEvaluationTemplate::class, 'template_id');
    }
}