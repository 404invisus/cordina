<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tte_sign_request_distributions', function (Blueprint $table) {
            $table->uuid('group_id')->nullable()->after('user_id');
            $table->string('group_name')->nullable()->after('group_id');
        });
        // user_id boleh null kalau distribusi ke group
        Schema::table('tte_sign_request_distributions', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
        });
        // hapus unique constraint lama, buat yang baru
        Schema::table('tte_sign_request_distributions', function (Blueprint $table) {
            $table->dropUnique(['sign_request_id', 'user_id']);
        });
    }
    public function down(): void
    {
        Schema::table('tte_sign_request_distributions', function (Blueprint $table) {
            $table->dropColumn(['group_id', 'group_name']);
        });
    }
};
