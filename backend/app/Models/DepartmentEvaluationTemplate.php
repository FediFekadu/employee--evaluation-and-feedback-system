<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentEvaluationTemplate extends Model
{
    use HasFactory;

    // Use the new table name for clarity
    protected $table = 'student_evaluation_templates';

    protected $fillable = [
        'department_id',
        'name',
        'description',
        'audience',
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
    public static function getActiveTemplate($departmentId, $audience = 'student')
    {
        return static::where('department_id', $departmentId)
            ->where('is_active', true)
            ->where('audience', $audience)
            ->with('questions')
            ->first();
    }
}