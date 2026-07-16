<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cr_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('cr_id');
            $table->uuid('uploader_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
            $table->foreign('cr_id')->references('id')->on('change_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cr_attachments');
    }
};
