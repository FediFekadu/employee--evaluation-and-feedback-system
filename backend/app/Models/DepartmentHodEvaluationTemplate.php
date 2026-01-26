<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentHodEvaluationTemplate extends Model
{
    use HasFactory;

    protected $table = 'department_hod_evaluation_templates';

    protected $fillable = [
        'department_id',
        'name',
        'description',
        'is_active',
        'form_info',
    ];

    protected $casts = [
        'form_info' => 'array',
        'is_active' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function questions()
    {
        return $this->hasMany(HodTemplateQuestion::class, 'template_id')->orderBy('order');
    }

    public static function getActiveTemplate($departmentId)
    {
        return static::where('department_id', $departmentId)
            ->where('is_active', true)
            ->with('questions')
            ->first();
    }
}