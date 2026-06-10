<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->string('title');
            $table->text('description');
            $table->text('reason');
            $table->text('impact')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('change_type', ['normal', 'emergency', 'standard'])->default('normal');
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->uuid('requester_id');
            $table->uuid('reviewer_id')->nullable();
            $table->text('reviewer_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'requester_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_requests');
    }
};
