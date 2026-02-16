<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->string('identity_doc_back_path')->nullable()->after('identity_doc_path');
            $table->string('identity_doc_back_mime')->nullable()->after('identity_doc_mime');
            $table->longText('identity_ocr_text_back')->nullable()->after('identity_ocr_text');
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn(['identity_doc_back_path','identity_doc_back_mime','identity_ocr_text_back']);
        });
    }
};
