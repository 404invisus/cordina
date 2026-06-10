<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->enum('status', ['upcoming', 'ongoing', 'done'])->default('upcoming')->after('all_day');
            $table->text('notulensi')->nullable()->after('status');
            $table->text('hasil_pembahasan')->nullable()->after('notulensi');
            $table->text('tindak_lanjut')->nullable()->after('hasil_pembahasan');
            $table->json('attachments')->nullable()->after('tindak_lanjut');
        });
    }
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropColumn(['status', 'notulensi', 'hasil_pembahasan', 'tindak_lanjut', 'attachments']);
        });
    }
};
