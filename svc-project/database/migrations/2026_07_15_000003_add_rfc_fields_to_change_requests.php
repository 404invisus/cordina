<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->text('rincian')->nullable()->after('impact');
            $table->date('rencana_waktu')->nullable()->after('rincian');
            $table->text('dependensi_layanan')->nullable()->after('rencana_waktu');
            $table->text('si_terdampak')->nullable()->after('dependensi_layanan');
            $table->text('langkah_mitigasi')->nullable()->after('si_terdampak');
            $table->text('risiko_tidak_dilakukan')->nullable()->after('langkah_mitigasi');
            $table->text('langkah_penanganan_kegagalan')->nullable()->after('risiko_tidak_dilakukan');
            $table->json('pelaksana_ids')->nullable()->after('signer_id');
        });
    }

    public function down(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropColumn([
                'rincian', 'rencana_waktu', 'dependensi_layanan',
                'si_terdampak', 'langkah_mitigasi', 'risiko_tidak_dilakukan',
                'langkah_penanganan_kegagalan', 'pelaksana_ids',
            ]);
        });
    }
};
