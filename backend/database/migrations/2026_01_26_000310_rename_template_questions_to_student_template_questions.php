<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop FK constraint first to avoid rename issues
        if (Schema::hasTable('template_questions')) {
            Schema::table('template_questions', function (Blueprint $table) {
                try { $table->dropForeign(['template_id']); } catch (\Throwable $e) { /* ignore */ }
            });
        }

        // Rename table
        if (Schema::hasTable('template_questions') && !Schema::hasTable('student_template_questions')) {
            Schema::rename('template_questions', 'student_template_questions');
        }

        // Recreate FK pointing to student_evaluation_templates
        if (Schema::hasTable('student_template_questions')) {
            Schema::table('student_template_questions', function (Blueprint $table) {
                $table->foreign('template_id')
                      ->references('id')
                      ->on('student_evaluation_templates')
                      ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        // Drop FK first
        if (Schema::hasTable('student_template_questions')) {
            Schema::table('student_template_questions', function (Blueprint $table) {
                try { $table->dropForeign(['template_id']); } catch (\Throwable $e) { /* ignore */ }
            });
        }

        // Rename back
        if (Schema::hasTable('student_template_questions') && !Schema::hasTable('template_questions')) {
            Schema::rename('student_template_questions', 'template_questions');
        }

        // Restore FK to department_evaluation_templates (original)
        if (Schema::hasTable('template_questions')) {
            Schema::table('template_questions', function (Blueprint $table) {
                $table->foreign('template_id')
                      ->references('id')
                      ->on('department_evaluation_templates')
                      ->onDelete('cascade');
            });
        }
    }
};