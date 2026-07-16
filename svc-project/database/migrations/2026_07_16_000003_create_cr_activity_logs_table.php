<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cr_activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('cr_id');
            $table->uuid('actor_id');
            $table->string('action'); // created, submitted, approved, rejected, implemented, attachment_added, attachment_deleted, signed
            $table->text('note')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('cr_id')->references('id')->on('change_requests')->onDelete('cascade');
            $table->index(['cr_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cr_activity_logs');
    }
};
