<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('calendar_event_participants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('event_id');
            $table->uuid('user_id');
            $table->string('status')->default('invited'); // invited, accepted, declined
            $table->uuid('assigned_by');
            $table->timestamps();

            $table->foreign('event_id')
                  ->references('id')
                  ->on('calendar_events')
                  ->onDelete('cascade');

            $table->unique(['event_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_event_participants');
    }
};
