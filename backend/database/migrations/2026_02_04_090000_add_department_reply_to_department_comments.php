<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->text('department_reply')->nullable()->after('text');
            $table->timestamp('department_reply_at')->nullable()->after('department_reply');
        });
    }

    public function down(): void
    {
        Schema::table('department_comments', function (Blueprint $table) {
            $table->dropColumn(['department_reply', 'department_reply_at']);
        });
    }
};
