<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeerEvaluation extends Model
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

    public function assignees(): HasMany
    {
        return $this->hasMany(PeerEvaluationAssignee::class);
    }
}