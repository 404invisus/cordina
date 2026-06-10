<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->date('date');
            $table->enum('type', ['clock_in', 'clock_out'])->default('clock_in');
            $table->enum('work_mode', ['wfo', 'wfh', 'dinas_luar', 'cuti'])->default('wfo');
            $table->time('time')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('distance_from_office')->nullable();
            $table->enum('status', ['hadir', 'terlambat', 'pulang_cepat', 'dinas_luar', 'cuti', 'wfh', 'diluar_radius'])->default('hadir');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'date', 'type']);
            $table->index(['user_id', 'date']);
            $table->index('date');
        });
    }
    public function down(): void { Schema::dropIfExists('attendances'); }
};
