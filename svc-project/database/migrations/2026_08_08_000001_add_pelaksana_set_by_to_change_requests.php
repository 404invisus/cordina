<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pelaksana CR kini ditetapkan oleh penilai, bukan oleh pengaju. Kolom ini
 * mencatat penilai mana yang menetapkannya, sekaligus menjadi kunci agar
 * penilai berikutnya tidak dapat menimpanya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->uuid('pelaksana_set_by')->nullable()->after('pelaksana_ids');
            $table->timestamp('pelaksana_set_at')->nullable()->after('pelaksana_set_by');
        });
    }

    public function down(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropColumn(['pelaksana_set_by', 'pelaksana_set_at']);
        });
    }
};
