<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Donor;

class BackfillDonorType extends Command
{
    protected $signature = 'donors:backfill-type {--dry-run : Show counts only without updating}';
    protected $description = 'Backfill donor_type for donors incorrectly classified as KIDNEY when they are blood-only donors.';

    public function handle(): int
    {
        $query = Donor::query()
            ->where('donor_type', 'KIDNEY')
            ->whereNotNull('blood_group')
            ->whereNull('hla_typing')
            ->whereNull('pra_score')
            ->whereNull('crossmatch_result');

        $count = $query->count();
        if ($count === 0) {
            $this->info('No donors to backfill.');
            return Command::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("[DRY RUN] Would update {$count} donors to BLOOD");
            return Command::SUCCESS;
        }

        $updated = $query->update(['donor_type' => 'BLOOD']);
        $this->info("Updated {$updated} donors to BLOOD donor_type.");
        return Command::SUCCESS;
    }
}
