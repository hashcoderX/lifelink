<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Donor;
use Illuminate\Support\Facades\Auth;

class DonorObserver
{
    public function created(Donor $donor): void
    {
        // Auto-generate donor_code like DNR-001 if not provided
        if (empty($donor->donor_code)) {
            $donor->donor_code = sprintf('DNR-%03d', $donor->id);
            $donor->saveQuietly();
        }

        ActivityLog::create([
            'action' => 'CREATED',
            'entity_type' => 'DONOR',
            'entity_id' => $donor->id,
            'user_id' => Auth::id(),
            'details' => [ 'attributes' => $donor->getAttributes() ],
        ]);
    }

    public function updated(Donor $donor): void
    {
        ActivityLog::create([
            'action' => 'UPDATED',
            'entity_type' => 'DONOR',
            'entity_id' => $donor->id,
            'user_id' => Auth::id(),
            'details' => [ 'changes' => $donor->getChanges() ],
        ]);
    }

    public function deleted(Donor $donor): void
    {
        ActivityLog::create([
            'action' => 'DELETED',
            'entity_type' => 'DONOR',
            'entity_id' => $donor->id,
            'user_id' => Auth::id(),
            'details' => null,
        ]);
    }
}
