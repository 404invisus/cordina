<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Penilai boleh menyambungkan CR ke sebuah Epic supaya story turunannya
 * bisa dibuat langsung dari halaman CR. Hanya satu penilai yang boleh
 * mengunci penyambungan (siapa yang duluan menyambung), tercermin lewat
 * kolom epic_linked_by/epic_linked_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->uuid('epic_id')->nullable()->after('signed_document_id');
            $table->uuid('epic_linked_by')->nullable()->after('epic_id');
            $table->timestamp('epic_linked_at')->nullable()->after('epic_linked_by');

            $table->foreign('epic_id')
                ->references('id')->on('epics')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropForeign(['epic_id']);
            $table->dropColumn(['epic_id', 'epic_linked_by', 'epic_linked_at']);
        });
    }
};
