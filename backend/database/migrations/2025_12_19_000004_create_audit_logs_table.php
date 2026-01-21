<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->enum('user_type', ['student', 'teacher', 'admin']);
            $table->string('action', 100);
            $table->string('resource_type', 50);
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->json('details')->nullable()->comment('Additional action details in JSON format');
            $table->string('ip_address', 45)->nullable()->comment('IPv4 or IPv6 address');
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes for optimal query performance
            $table->index(['user_id', 'user_type'], 'idx_user_logs');
            $table->index(['resource_type', 'resource_id'], 'idx_resource_logs');
            $table->index('action', 'idx_action_logs');
            $table->index('created_at', 'idx_created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};