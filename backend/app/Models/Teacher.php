<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = ['department_id', 'name', 'email', 'title', 'photo_url'];

    /**
     * Ensure photo_url is an absolute URL so the frontend can load it
     * regardless of its own origin/port.
     */
    public function getPhotoUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }
        // If already absolute, return as-is
        if (is_string($value) && (str_starts_with($value, 'http://') || str_starts_with($value, 'https://'))) {
            return $value;
        }
        // Convert relative storage path (e.g., /storage/...) to absolute URL.
        // Prefer the current request host (includes dev port), otherwise fallback to app.url.
        try {
            $base = request()->getSchemeAndHttpHost();
        } catch (\Throwable $e) {
            $base = config('app.url');
        }
        $base = rtrim((string) $base, '/');
        $path = '/' . ltrim((string) $value, '/');
        return $base . $path;
    }

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