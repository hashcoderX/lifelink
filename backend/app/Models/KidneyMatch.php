<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KidneyMatch extends Model
{
    protected $fillable = [
        'donor_id','patient_id','compatibility_score','status','matched_at',
    ];

    protected $casts = [
        'matched_at' => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
