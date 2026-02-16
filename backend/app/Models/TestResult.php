<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestResult extends Model
{
    protected $fillable = [
        'patient_id','donor_id','type','name','result','is_positive','performed_at',
    ];

    protected $casts = [
        'is_positive' => 'boolean',
        'performed_at' => 'datetime',
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
