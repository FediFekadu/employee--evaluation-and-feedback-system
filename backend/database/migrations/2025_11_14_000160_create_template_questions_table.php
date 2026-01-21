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
        Schema::create('template_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('department_evaluation_templates')->onDelete('cascade');
            $table->text('text');
            $table->enum('type', ['rating', 'text'])->default('rating');
            $table->integer('order')->default(0);
            $table->string('section')->nullable(); // A, B, C for grouping
            $table->timestamps();
            
            $table->index(['template_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_questions');
    }
};