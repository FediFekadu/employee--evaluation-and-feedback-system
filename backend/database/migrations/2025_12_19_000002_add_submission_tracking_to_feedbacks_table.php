<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->foreignId('submission_id')->nullable()->constrained('evaluation_submissions')->cascadeOnDelete();
            $table->boolean('is_locked')->default(false)->comment('Prevents modification after submission');
            
            // Index for submission tracking
            $table->index('submission_id', 'idx_submission_id');
        });
    }

    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropForeign(['submission_id']);
            $table->dropIndex('idx_submission_id');
            $table->dropColumn(['submission_id', 'is_locked']);
        });
    }
};