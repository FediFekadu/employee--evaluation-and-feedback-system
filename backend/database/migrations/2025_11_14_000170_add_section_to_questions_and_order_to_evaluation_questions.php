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
        Schema::table('questions', function (Blueprint $table) {
            $table->string('section', 10)->nullable()->after('type');
        });

        Schema::table('evaluation_questions', function (Blueprint $table) {
            $table->integer('order')->default(0)->after('question_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('section');
        });

        Schema::table('evaluation_questions', function (Blueprint $table) {
            $table->dropColumn('order');
        });
    }
};