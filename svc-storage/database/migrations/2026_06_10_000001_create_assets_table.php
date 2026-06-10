<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->string('category');
            $table->string('serial_number')->nullable();
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat'])->default('baik');
            $table->string('location')->nullable();
            $table->date('acquired_at')->nullable();
            $table->decimal('value', 15, 2)->nullable();
            $table->string('responsible_user_id')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();
            $table->index('category');
        });
    }
    public function down(): void { Schema::dropIfExists('assets'); }
};
