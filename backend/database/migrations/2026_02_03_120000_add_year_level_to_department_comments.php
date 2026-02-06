<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->string('year_level')->nullable()->after('semester');
        });
    }

    public function down(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->dropColumn('year_level');
        });
    }
};
