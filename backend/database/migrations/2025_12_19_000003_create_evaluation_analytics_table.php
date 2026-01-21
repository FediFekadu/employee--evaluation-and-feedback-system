<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluation_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->integer('total_eligible_students');
            $table->integer('total_submissions');
            $table->decimal('participation_rate', 5, 2)->comment('Percentage with 2 decimal places');
            $table->decimal('average_rating', 3, 2)->nullable()->comment('Average rating with 2 decimal places');
            $table->decimal('weighted_score', 5, 2)->nullable()->comment('Weighted score with 2 decimal places');
            $table->timestamp('calculated_at');
            $table->timestamps();
            
            // Index for optimal query performance
            $table->index('evaluation_id', 'idx_evaluation_analytics');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_analytics');
    }
};