<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('stories', function (Blueprint $table) {
            $table->date('due_date')->nullable()->after('assignee_id');
            $table->unsignedSmallInteger('estimated_hours')->nullable()->after('due_date');
            $table->string('type', 50)->nullable()->default('story')->after('estimated_hours');
        });
    }
    public function down(): void {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn(['due_date', 'estimated_hours', 'type']);
        });
    }
};
