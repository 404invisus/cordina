<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cr_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('cr_id');
            $table->uuid('approver_id');
            $table->enum('role', ['reviewer', 'signer']);
            $table->unsignedInteger('order');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();
            $table->foreign('cr_id')->references('id')->on('change_requests')->onDelete('cascade');
            $table->index(['cr_id', 'order']);
        });

        Schema::table('change_requests', function (Blueprint $table) {
            $table->unsignedInteger('current_step')->default(0)->after('status');
            $table->unsignedInteger('total_steps')->default(0)->after('current_step');
            $table->uuid('signer_id')->nullable()->after('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cr_approvals');
        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropColumn(['current_step', 'total_steps', 'signer_id']);
        });
    }
};
