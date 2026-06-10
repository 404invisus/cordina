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
       Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('type');
            $table->jsonb('payload');
            $table->string('channel')->default('telegram');
            $table->string('status')->default('pending'); // pending, sent, failed, read
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index('type');
        });

        Schema::create('user_notification_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('channel'); // telegram, email (future)
            $table->string('event_type'); // task.assigned, task.commented, etc.
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'channel', 'event_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_settings');
        Schema::dropIfExists('notifications');
    }
};
