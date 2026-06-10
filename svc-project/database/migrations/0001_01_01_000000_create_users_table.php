<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // active, archived, completed
            $table->uuid('owner_id');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->jsonb('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('project_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('user_id');
            $table->string('role')->default('member'); // owner, manager, scrum_master, member
            $table->timestamp('joined_at');
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('epics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('open');
            $table->string('color', 7)->default('#6366f1');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('sprints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('name');
            $table->text('goal')->nullable();
            $table->string('status')->default('planned'); // planned, active, completed
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('velocity')->nullable();
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('stories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('epic_id')->nullable();
            $table->uuid('sprint_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('backlog');
            $table->integer('story_points')->nullable();
            $table->string('priority')->default('medium'); // low, medium, high, critical
            $table->uuid('assignee_id')->nullable();
            $table->timestamps();
            $table->foreign('epic_id')->references('id')->on('epics')->nullOnDelete();
            $table->foreign('sprint_id')->references('id')->on('sprints')->nullOnDelete();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('story_id')->nullable();
            $table->uuid('sprint_id')->nullable();
            $table->uuid('parent_task_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('task'); // task, bug, subtask
            $table->string('status')->default('todo'); // todo, in_progress, review, done
            $table->string('priority')->default('medium');
            $table->string('severity')->nullable(); // for bugs: low, medium, high, critical
            $table->uuid('assignee_id')->nullable();
            $table->uuid('reporter_id');
            $table->decimal('estimated_hours', 8, 2)->nullable();
            $table->decimal('actual_hours', 8, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->jsonb('custom_fields')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('story_id')->references('id')->on('stories')->nullOnDelete();
            $table->foreign('sprint_id')->references('id')->on('sprints')->nullOnDelete();
            $table->foreign('parent_task_id')->references('id')->on('projects')->nullOnDelete();
        });

        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->uuid('task_id');
            $table->uuid('depends_on_task_id');
            $table->primary(['task_id', 'depends_on_task_id']);
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('depends_on_task_id')->references('id')->on('tasks')->cascadeOnDelete();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->text('content');
            $table->jsonb('mentions')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
        });

        Schema::create('time_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->decimal('logged_hours', 8, 2);
            $table->text('description')->nullable();
            $table->date('logged_at');
            $table->timestamps();
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema::dropIfExists('attachments');
        Schema::dropIfExists('time_logs');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('task_dependencies');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('stories');
        Schema::dropIfExists('sprints');
        Schema::dropIfExists('epics');
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
    }
};
