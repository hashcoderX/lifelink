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
        Schema::table('donors', function (Blueprint $table) {
            $table->enum('donor_type', ['BLOOD','KIDNEY','EYE'])->default('KIDNEY')->change();
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->enum('donor_type', ['BLOOD','KIDNEY'])->default('KIDNEY')->change();
        });
    }
};
