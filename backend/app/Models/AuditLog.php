<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_type',
        'action',
        'resource_type',
        'resource_id',
        'details',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Indicates if the model should be timestamped.
     * Only created_at is used for audit logs.
     */
    public $timestamps = false;

    protected $dates = ['created_at'];

    /**
     * The attributes that should be mutated to dates.
     */
    protected $dateFormat = 'Y-m-d H:i:s';

    /**
     * Boot the model to implement immutability controls and set created_at automatically.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = now();
        });

        // Prevent updates to audit logs (immutability)
        static::updating(function ($model) {
            throw new \Exception('Audit logs are immutable and cannot be modified.');
        });

        // Prevent deletion of audit logs
        static::deleting(function ($model) {
            throw new \Exception('Audit logs cannot be deleted to maintain audit trail integrity.');
        });
    }
}