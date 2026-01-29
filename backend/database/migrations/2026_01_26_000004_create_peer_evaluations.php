<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('peer_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete(); // Evaluated teacher
            $table->string('academic_year');
            $table->string('semester');
            $table->date('opened_at');
            $table->date('closed_at')->nullable();
            $table->unsignedBigInteger('template_id')->nullable(); // Active peer template snapshot
            $table->string('status')->default('open');
            $table->timestamps();

            $table->unique(['department_id', 'teacher_id', 'academic_year', 'semester'], 'uniq_peer_eval_teacher_semester');
            $table->index(['department_id', 'academic_year', 'semester'], 'idx_peer_eval_semester');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peer_evaluations');
    }
};