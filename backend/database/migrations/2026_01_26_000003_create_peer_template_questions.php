<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('peer_template_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->text('text');
            $table->enum('type', ['rating', 'text'])->default('rating');
            $table->string('section', 10)->nullable();
            $table->unsignedInteger('order')->default(1);
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('department_peer_evaluation_templates')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peer_template_questions');
    }
};