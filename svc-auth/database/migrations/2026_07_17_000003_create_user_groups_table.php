<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('telegram_chat_id')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
        });

        Schema::create('user_group_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('group_id');
            $table->uuid('user_id');
            $table->timestamps();
            $table->foreign('group_id')->references('id')->on('user_groups')->onDelete('cascade');
            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_group_members');
        Schema::dropIfExists('user_groups');
    }
};
