<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->uuid('parent_id')->nullable();
            $table->uuid('owner_id');
            // null = inherit from parent folder (or 'private' if this is a root folder)
            $table->enum('visibility', ['private', 'internal', 'public'])->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'parent_id']);
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('folders')->onDelete('cascade');
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->uuid('folder_id')->nullable()->after('user_id');
            // null = inherit from folder (or 'private' if at root, i.e. folder_id is null)
            $table->enum('visibility', ['private', 'internal', 'public'])->nullable()->after('folder_id');

            $table->foreign('folder_id')->references('id')->on('folders')->onDelete('cascade');
            $table->index(['user_id', 'folder_id']);
        });
    }

    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn(['folder_id', 'visibility']);
        });
        Schema::dropIfExists('folders');
    }
};
