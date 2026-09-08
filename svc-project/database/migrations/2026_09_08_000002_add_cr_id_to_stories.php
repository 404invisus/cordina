<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Story yang dibuat lewat halaman CR akan mengisi kolom cr_id ini agar
 * kita bisa menampilkan daftar story turunan sebuah CR dan melacak asal
 * usulnya. Story yang dibuat manual di backlog tetap boleh bernilai null.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->uuid('cr_id')->nullable()->after('epic_id');

            $table->foreign('cr_id')
                ->references('id')->on('change_requests')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['cr_id']);
            $table->dropColumn('cr_id');
        });
    }
};
