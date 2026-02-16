<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_path',
        'file_mime',
        'ocr_text',
        'text_hash',
        'ai_status',
        'ai_message',
        'ai_summary',
        'ai_key_findings',
        'ai_raw_json',
        'meta',
    ];

    protected $casts = [
        'ai_key_findings' => 'array',
        'ai_raw_json' => 'array',
        'meta' => 'array',
    ];
}
