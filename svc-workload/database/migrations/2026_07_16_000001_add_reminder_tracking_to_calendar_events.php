<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->timestamp('reminder_h1_sent_at')->nullable()->after('attachments');
            $table->timestamp('reminder_h0_sent_at')->nullable()->after('reminder_h1_sent_at');
        });
    }
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropColumn(['reminder_h1_sent_at', 'reminder_h0_sent_at']);
        });
    }
};
