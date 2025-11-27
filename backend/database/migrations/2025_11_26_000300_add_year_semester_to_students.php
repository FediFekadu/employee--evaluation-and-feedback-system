<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'year_level')) {
                $table->unsignedTinyInteger('year_level')->default(1)->after('student_id');
            }
            if (!Schema::hasColumn('students', 'semester')) {
                $table->unsignedTinyInteger('semester')->default(1)->after('year_level');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'semester')) {
                $table->dropColumn('semester');
            }
            if (Schema::hasColumn('students', 'year_level')) {
                $table->dropColumn('year_level');
            }
        });
    }
};