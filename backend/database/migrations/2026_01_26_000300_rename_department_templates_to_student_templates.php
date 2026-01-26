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
        // Drop existing foreign key on template_questions that references the old table
        if (Schema::hasTable('template_questions')) {
            Schema::table('template_questions', function (Blueprint $table) {
                // Safely drop FK by column; Laravel will infer the key name
                try { $table->dropForeign(['template_id']); } catch (\Throwable $e) { /* ignore if not exists */ }
            });
        }

        // Rename the main templates table to student_evaluation_templates
        if (Schema::hasTable('department_evaluation_templates') && !Schema::hasTable('student_evaluation_templates')) {
            Schema::rename('department_evaluation_templates', 'student_evaluation_templates');
        }

        // Re-create foreign key to point to the new table
        if (Schema::hasTable('template_questions')) {
            Schema::table('template_questions', function (Blueprint $table) {
                $table->foreign('template_id')
                      ->references('id')
                      ->on('student_evaluation_templates')
                      ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop FK referencing student_evaluation_templates
        if (Schema::hasTable('template_questions')) {
            Schema::table('template_questions', function (Blueprint $table) {
                try { $table->dropForeign(['template_id']); } catch (\Throwable $e) { /* ignore if not exists */ }
            });
        }

        // Rename back to original
        if (Schema::hasTable('student_evaluation_templates') && !Schema::hasTable('department_evaluation_templates')) {
            Schema::rename('student_evaluation_templates', 'department_evaluation_templates');
        }

        // Restore FK to original table
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