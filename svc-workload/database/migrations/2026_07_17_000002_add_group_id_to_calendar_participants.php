<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('calendar_event_participants', function (Blueprint $table) {
            $table->uuid('group_id')->nullable()->after('user_id');
            $table->string('group_name')->nullable()->after('group_id');
        });
    }
    public function down(): void
    {
        Schema::table('calendar_event_participants', function (Blueprint $table) {
            $table->dropColumn(['group_id', 'group_name']);
        });
    }
};
