<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_extra_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('permission');
            $table->boolean('granted')->default(true);
            $table->uuid('granted_by');
            $table->timestamps();
            $table->unique(['user_id', 'permission']);
            $table->index('user_id');
        });
    }
    public function down(): void { Schema::dropIfExists('user_extra_permissions'); }
};
