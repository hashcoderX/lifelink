<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Patient;
use Illuminate\Support\Facades\Auth;

class PatientObserver
{
    public function created(Patient $patient): void
    {
        // Auto-generate patient_code like PAT-045 if not provided
        if (empty($patient->patient_code)) {
            $patient->patient_code = sprintf('PAT-%03d', $patient->id);
            $patient->saveQuietly();
        }

        ActivityLog::create([
            'action' => 'CREATED',
            'entity_type' => 'PATIENT',
            'entity_id' => $patient->id,
            'user_id' => Auth::id(),
            'details' => [ 'attributes' => $patient->getAttributes() ],
        ]);
    }

    public function updated(Patient $patient): void
    {
        ActivityLog::create([
            'action' => 'UPDATED',
            'entity_type' => 'PATIENT',
            'entity_id' => $patient->id,
            'user_id' => Auth::id(),
            'details' => [ 'changes' => $patient->getChanges() ],
        ]);
    }

    public function deleted(Patient $patient): void
    {
        ActivityLog::create([
            'action' => 'DELETED',
            'entity_type' => 'PATIENT',
            'entity_id' => $patient->id,
            'user_id' => Auth::id(),
            'details' => null,
        ]);
    }
}
