<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('peer_evaluation_assignees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peer_evaluation_id')->constrained('peer_evaluations')->cascadeOnDelete();
            $table->foreignId('evaluator_teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->string('status')->default('pending'); // pending | completed | declined
            $table->timestamps();

            $table->unique(['peer_evaluation_id', 'evaluator_teacher_id'], 'uniq_peer_assignment');
            $table->index(['evaluator_teacher_id', 'status'], 'idx_peer_assignee_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peer_evaluation_assignees');
    }
};