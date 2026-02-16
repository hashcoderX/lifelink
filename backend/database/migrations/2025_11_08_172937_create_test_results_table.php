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
        Schema::create('test_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('donor_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['HLA','CROSSMATCH','INFECTIOUS','OTHER'])->default('OTHER');
            $table->string('name')->nullable();
            $table->text('result')->nullable();
            $table->boolean('is_positive')->nullable();
            $table->timestamp('performed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_results');
    }
};
