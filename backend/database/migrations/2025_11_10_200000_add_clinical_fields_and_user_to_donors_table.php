<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('donor_code');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->decimal('bmi',5,2)->nullable()->after('age');
            $table->enum('rh_factor', ['POSITIVE','NEGATIVE'])->nullable()->after('blood_group');
            $table->decimal('urea_level', 6, 2)->nullable()->after('gfr');
            $table->enum('dsa', ['POSITIVE','NEGATIVE'])->nullable()->after('crossmatch_result');
            $table->boolean('diabetes')->nullable()->after('location');
            $table->boolean('hypertension')->nullable()->after('diabetes');
            $table->boolean('rejection_history')->nullable()->after('hypertension');
            $table->boolean('previous_transplant')->nullable()->after('rejection_history');
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id','bmi','rh_factor','urea_level','dsa','diabetes','hypertension','rejection_history','previous_transplant']);
        });
    }
};
