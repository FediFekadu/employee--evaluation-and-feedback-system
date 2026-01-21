<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'text',
        'type',
        'order',
        'section',
    ];

    public function template()
    {
        return $this->belongsTo(DepartmentEvaluationTemplate::class, 'template_id');
    }
}