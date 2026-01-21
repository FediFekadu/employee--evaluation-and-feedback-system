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
        Schema::create('department_evaluation_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('name')->default('Default Evaluation Template');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('form_info')->nullable(); // Store university name, form title, etc.
            $table->timestamps();
            
            $table->index(['department_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_evaluation_templates');
    }
};