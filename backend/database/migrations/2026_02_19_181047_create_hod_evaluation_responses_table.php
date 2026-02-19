<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hod_evaluation_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hod_evaluation_id')->constrained('hod_evaluations')->onDelete('cascade');
            // We reference the question by ID. If the question is deleted, we cascade delete the response.
            $table->foreignId('hod_template_question_id')->constrained('hod_template_questions')->onDelete('cascade');
            
            $table->integer('rating')->nullable()->comment('1-5 scale usually');
            $table->text('text')->nullable();
            
            $table->timestamps();

            // Ensure unique response per evaluation per question
            $table->unique(['hod_evaluation_id', 'hod_template_question_id'], 'hod_eval_resp_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hod_evaluation_responses');
    }
};
