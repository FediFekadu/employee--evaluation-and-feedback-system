<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PeerTemplateQuestion extends Model
{
    use HasFactory;

    protected $table = 'peer_template_questions';

    protected $fillable = [
        'template_id',
        'text',
        'type',
        'section',
        'order',
    ];

    public function template()
    {
        return $this->belongsTo(DepartmentPeerEvaluationTemplate::class, 'template_id');
    }
}