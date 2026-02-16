<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update invalid sex data
        DB::statement("UPDATE donors SET sex = NULL WHERE sex NOT IN ('M', 'F')");
        // Update boolean columns to default
        DB::statement("UPDATE donors SET diabetes = 0, hypertension = 0, rejection_history = 0, previous_transplant = 0");

        Schema::table('donors', function (Blueprint $table) {
            $table->integer('age')->nullable()->change();
            $table->enum('sex', ['M', 'F'])->nullable()->change();
            $table->decimal('bmi', 5, 2)->nullable()->change();
            $table->json('hla_typing')->nullable()->change();
            $table->string('crossmatch_result')->nullable()->change();
            $table->decimal('pra_score', 5, 2)->nullable()->change();
            $table->decimal('creatinine_level', 8, 2)->nullable()->change();
            $table->integer('gfr')->nullable()->change();
            $table->decimal('urea_level', 8, 2)->nullable()->change();
            $table->string('dsa')->nullable()->change();
            $table->json('infectious_test_results')->nullable()->change();
            $table->boolean('diabetes')->default(false)->change();
            $table->boolean('hypertension')->default(false)->change();
            $table->boolean('rejection_history')->default(false)->change();
            $table->boolean('previous_transplant')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn(['age', 'sex', 'bmi', 'hla_typing', 'crossmatch_result', 'pra_score', 'creatinine_level', 'gfr', 'urea_level', 'dsa', 'infectious_test_results', 'diabetes', 'hypertension', 'rejection_history', 'previous_transplant']);
        });
    }
};
