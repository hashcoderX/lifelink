<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->string('identity_doc_path')->nullable()->after('previous_transplant');
            $table->string('identity_doc_mime')->nullable()->after('identity_doc_path');
            $table->longText('identity_ocr_text')->nullable()->after('identity_doc_mime');
            $table->string('nic_number', 20)->nullable()->after('identity_ocr_text');
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn(['identity_doc_path', 'identity_doc_mime', 'identity_ocr_text', 'nic_number']);
        });
    }
};
