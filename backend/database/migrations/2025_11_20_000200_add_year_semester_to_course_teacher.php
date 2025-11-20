<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('course_teacher', function (Blueprint $table) {
            $table->tinyInteger('year_level')->nullable()->after('teacher_id');
            $table->string('semester', 20)->nullable()->after('year_level');
            $table->index(['course_id', 'teacher_id', 'year_level', 'semester'], 'course_teacher_assignment_idx');
        });
    }

    public function down(): void
    {
        Schema::table('course_teacher', function (Blueprint $table) {
            $table->dropIndex('course_teacher_assignment_idx');
            $table->dropColumn(['year_level', 'semester']);
        });
    }
};