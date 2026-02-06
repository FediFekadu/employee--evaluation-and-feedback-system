<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'student_id',
        'anonymous',
        'target_type',
        'target_id',
        'teacher_id',
        'course_id',
        'academic_year',
        'semester',
        'year_level',
        'text',
        'department_reply',
        'department_reply_at',
        'status',
        'moderation_notes',
        'flagged',
        'flag_reason',
    ];

    protected $casts = [
        'anonymous' => 'boolean',
        'flagged' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'target_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'target_id');
    }
}
