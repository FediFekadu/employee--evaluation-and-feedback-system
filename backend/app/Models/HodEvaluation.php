<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HodEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'teacher_id',
        'academic_year',
        'semester',
        'opened_at',
        'closed_at',
        'template_id',
        'score',
        'remarks',
        'hod_user_id',
        'status',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function hodUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hod_user_id');
    }
}