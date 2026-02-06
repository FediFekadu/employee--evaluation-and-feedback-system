<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete()->after('target_id');
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete()->after('teacher_id');
            $table->index(['department_id', 'teacher_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['course_id']);
            $table->dropIndex(['department_id', 'teacher_id', 'course_id']);
            $table->dropColumn(['teacher_id', 'course_id']);
        });
    }
};
