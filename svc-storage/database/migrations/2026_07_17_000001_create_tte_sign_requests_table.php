<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tte_sign_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->uuid('creator_id');
            $table->uuid('original_attachment_id');
            $table->uuid('signed_attachment_id')->nullable();
            $table->enum('status', ['draft','waiting_signature','signed','distributed'])->default('draft');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['creator_id', 'status']);
        });

        Schema::create('tte_sign_request_signers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sign_request_id');
            $table->uuid('user_id');
            $table->unsignedTinyInteger('order')->default(1);
            $table->enum('status', ['pending','signed','rejected'])->default('pending');
            $table->string('passphrase_hint')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->text('note')->nullable();
            $table->uuid('signed_attachment_id')->nullable();
            $table->timestamps();
            $table->foreign('sign_request_id')->references('id')->on('tte_sign_requests')->onDelete('cascade');
            $table->index(['sign_request_id', 'order']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('tte_sign_request_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sign_request_id');
            $table->uuid('user_id');
            $table->string('action'); // created, signer_added, submitted, signed, rejected, distributed
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('sign_request_id')->references('id')->on('tte_sign_requests')->onDelete('cascade');
            $table->index(['sign_request_id', 'created_at']);
        });

        Schema::create('tte_sign_request_distributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sign_request_id');
            $table->uuid('user_id');
            $table->timestamp('distributed_at')->useCurrent();
            $table->foreign('sign_request_id')->references('id')->on('tte_sign_requests')->onDelete('cascade');
            $table->unique(['sign_request_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tte_sign_request_distributions');
        Schema::dropIfExists('tte_sign_request_logs');
        Schema::dropIfExists('tte_sign_request_signers');
        Schema::dropIfExists('tte_sign_requests');
    }
};
