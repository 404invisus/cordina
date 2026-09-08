<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UI proyek meminta pengguna mengisi divisi/unit pengusul. Sebelumnya
 * field ini dikirim frontend tetapi diam-diam terbuang karena tidak
 * divalidasi, tidak fillable, dan tidak ada kolomnya. Migrasi ini
 * menambahkan kolom division sebagai teks pendek opsional.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('division', 100)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('division');
        });
    }
};
