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
        Schema::create('kidney_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('compatibility_score')->nullable();
            $table->enum('status', ['PENDING','APPROVED','REJECTED','COMPLETED'])->default('PENDING');
            $table->timestamp('matched_at')->nullable();
            $table->timestamps();
            $table->unique(['donor_id','patient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kidney_matches');
    }
};
