<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_capacities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sprint_id');
            $table->uuid('user_id');
            $table->decimal('available_hours', 5, 2)->default(80);
            $table->decimal('allocated_hours', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['sprint_id', 'user_id']);
            $table->index('sprint_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_capacities');
    }
};
