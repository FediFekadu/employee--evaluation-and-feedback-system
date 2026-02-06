<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'recipient_type',
        'recipient_id',
        'type',
        'title',
        'message',
        'meta',
        'priority',
        'read_at',
        'expires_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'read_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
