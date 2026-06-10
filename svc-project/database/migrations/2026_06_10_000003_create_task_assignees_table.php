<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('task_assignees', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->timestamps();
            $table->unique(['task_id', 'user_id']);
            $table->index('task_id');
            $table->index('user_id');
            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
        });

        // Migrate data lama dari assignee_id ke task_assignees
        DB::statement("
            INSERT INTO task_assignees (id, task_id, user_id, created_at, updated_at)
            SELECT gen_random_uuid(), id, assignee_id, NOW(), NOW()
            FROM tasks
            WHERE assignee_id IS NOT NULL
            AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignees');
    }
};
