<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('esign_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('title');
            $table->string('original_name');
            $table->uuid('attachment_id');
            $table->enum('tampilan', ['VISIBLE', 'INVISIBLE'])->default('VISIBLE');
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'signed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('esign_documents');
    }
};
