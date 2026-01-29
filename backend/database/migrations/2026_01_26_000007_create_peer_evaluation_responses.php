<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('peer_evaluation_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peer_evaluation_id')->constrained('peer_evaluations')->cascadeOnDelete();
            $table->foreignId('evaluator_teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->json('responses');
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['peer_evaluation_id', 'evaluator_teacher_id'], 'uniq_peer_response_once');
            $table->index(['peer_evaluation_id'], 'idx_peer_eval_resp_eval');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peer_evaluation_responses');
    }
};