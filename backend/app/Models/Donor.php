<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Donor extends Model
{
    protected $fillable = [
        'donor_code','user_id','full_name','age','sex','blood_group','hla_typing','crossmatch_result','pra_score','creatinine_level','gfr','infectious_test_results','medical_history','location','availability','donor_type',
        // New clinical fields
        'bmi','rh_factor','urea_level','dsa','diabetes','hypertension','rejection_history','previous_transplant',
        // Identity document fields
        'identity_doc_path','identity_doc_mime','identity_doc_back_path','identity_doc_back_mime','identity_ocr_text','identity_ocr_text_back','nic_number',
    ];

    protected $casts = [
        'hla_typing' => 'array',
        'infectious_test_results' => 'array',
        'availability' => 'boolean',
        'diabetes' => 'boolean',
        'hypertension' => 'boolean',
        'rejection_history' => 'boolean',
        'previous_transplant' => 'boolean',
    ];

    public function testResults(): HasMany
    {
        return $this->hasMany(TestResult::class);
    }

    public function medicalReports(): HasMany
    {
        return $this->hasMany(MedicalReport::class);
    }
}
