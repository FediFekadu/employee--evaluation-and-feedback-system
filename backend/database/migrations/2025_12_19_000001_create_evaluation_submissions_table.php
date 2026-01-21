<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluation_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at');
            $table->boolean('is_anonymous')->default(true);
            $table->string('submission_hash')->comment('For integrity verification');
            $table->timestamps();
            
            // Unique constraint to prevent duplicate submissions
            $table->unique(['evaluation_id', 'student_id'], 'unique_submission');
            
            // Indexes for optimal query performance
            $table->index('evaluation_id', 'idx_evaluation_submissions');
            $table->index('student_id', 'idx_student_submissions');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_submissions');
    }
};