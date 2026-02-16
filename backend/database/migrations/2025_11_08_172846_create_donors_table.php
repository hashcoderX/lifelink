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
        Schema::create('donors', function (Blueprint $table) {
            $table->id();
            $table->string('donor_code')->unique()->nullable()->comment('System generated code DNR-###');
            $table->string('full_name');
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('sex', ['MALE', 'FEMALE', 'OTHER'])->nullable();
            $table->enum('blood_group', ['A+','A-','B+','B-','AB+','AB-','O+','O-'])->nullable();
            $table->json('hla_typing')->nullable();
            $table->enum('crossmatch_result', ['POSITIVE','NEGATIVE','UNKNOWN'])->default('UNKNOWN');
            $table->unsignedTinyInteger('pra_score')->nullable();
            $table->decimal('creatinine_level', 5, 2)->nullable();
            $table->decimal('gfr', 6, 2)->nullable();
            $table->json('infectious_test_results')->nullable();
            $table->text('medical_history')->nullable();
            $table->string('location')->nullable();
            $table->boolean('availability')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donors');
    }
};
