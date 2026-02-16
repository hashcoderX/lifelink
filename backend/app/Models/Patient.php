<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Patient extends Model
{
    protected $fillable = [
        'patient_code','user_id','full_name','age','sex','blood_group','hla_typing','crossmatch_result','pra_score','current_creatinine','gfr','diagnosis','urgent_level','location',
        'rh_factor','dsa','urea_level','diabetes','hypertension','hiv_status','hbv_status','hcv_status','previous_transplant','rejection_history','bmi',
    ];

    protected $casts = [
        'hla_typing' => 'array',
        'diabetes' => 'boolean',
        'hypertension' => 'boolean',
        'previous_transplant' => 'boolean',
        'rejection_history' => 'boolean',
    ];

    protected $appends = ['is_complete'];

    public function getIsCompleteAttribute(): bool
    {
        $required = [
            'age','sex','blood_group','hla_typing','crossmatch_result','pra_score','current_creatinine','gfr','diagnosis','urgent_level','location'
        ];
        foreach ($required as $field) {
            $value = $this->{$field};
            if ($field === 'hla_typing') {
                if (empty($value) || !is_array($value) || count($value) === 0) return false;
            } elseif ($field === 'diagnosis') {
                if (empty($value) || trim((string)$value) === '') return false;
            } else {
                if ($value === null || $value === '') return false;
            }
        }
        return true;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function testResults(): HasMany
    {
        return $this->hasMany(TestResult::class);
    }

    public function medicalReports(): HasMany
    {
        return $this->hasMany(MedicalReport::class);
    }

}
