<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            // Default existing records to KIDNEY to preserve prior semantics
            $table->enum('donor_type', ['BLOOD','KIDNEY'])->default('KIDNEY')->after('sex');
        });

        // Heuristic backfill: mark likely blood donors as BLOOD
        // Criteria: has ABO blood_group set but no kidney-specific fields (hla_typing, pra_score, crossmatch_result)
        try {
            \Illuminate\Support\Facades\DB::table('donors')
                ->whereNotNull('blood_group')
                ->whereNull('hla_typing')
                ->whereNull('pra_score')
                ->whereNull('crossmatch_result')
                ->update(['donor_type' => 'BLOOD']);
        } catch (\Throwable $e) {
            // safe to ignore if columns not present in some environments
        }
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn('donor_type');
        });
    }
};
