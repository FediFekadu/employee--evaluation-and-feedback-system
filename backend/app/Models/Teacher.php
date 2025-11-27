<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Teacher extends Model
{
    protected $fillable = ['department_id', 'name', 'email', 'title'];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function courses(): BelongsToMany
    {
        // Include pivot metadata if present (e.g., year_level, semester)
        return $this->belongsToMany(Course::class)->withPivot(['year_level', 'semester']);
    }
}