<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentEvaluationTemplate extends Model
{
    use HasFactory;

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
        return $this->hasMany(TemplateQuestion::class, 'template_id')->orderBy('order');
    }

    /**
     * Get the active template for a department
     */
    public static function getActiveTemplate($departmentId)
    {
        return static::where('department_id', $departmentId)
            ->where('is_active', true)
            ->with('questions')
            ->first();
    }
}