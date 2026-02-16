<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalReport extends Model
{
    protected $fillable = [
        'patient_id','donor_id','report_type','summary','data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }
}
