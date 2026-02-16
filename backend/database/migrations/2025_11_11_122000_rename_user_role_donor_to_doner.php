<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'DONOR')->update(['role' => 'DONER']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'DONER')->update(['role' => 'DONOR']);
    }
};
