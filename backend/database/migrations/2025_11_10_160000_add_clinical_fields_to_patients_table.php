<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->enum('rh_factor', ['POSITIVE','NEGATIVE'])->nullable()->after('blood_group');
            $table->enum('dsa', ['POSITIVE','NEGATIVE'])->nullable()->after('rh_factor');
            $table->decimal('urea_level', 6, 2)->nullable()->after('gfr');
            $table->boolean('diabetes')->default(false)->after('urea_level');
            $table->boolean('hypertension')->default(false)->after('diabetes');
            $table->enum('hiv_status', ['POSITIVE','NEGATIVE'])->nullable()->after('hypertension');
            $table->enum('hbv_status', ['POSITIVE','NEGATIVE'])->nullable()->after('hiv_status');
            $table->enum('hcv_status', ['POSITIVE','NEGATIVE'])->nullable()->after('hbv_status');
            $table->boolean('previous_transplant')->default(false)->after('hcv_status');
            $table->boolean('rejection_history')->default(false)->after('previous_transplant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'rh_factor','dsa','urea_level','diabetes','hypertension','hiv_status','hbv_status','hcv_status','previous_transplant','rejection_history'
            ]);
        });
    }
};
