<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tte_configs', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default values dari env
        \Illuminate\Support\Facades\DB::table('tte_configs')->insert([
            ['key' => 'TTE_BASE_URL', 'value' => env('TTE_BASE_URL', 'https://esign-dev.layanan.go.id'), 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'TTE_USERNAME', 'value' => env('TTE_USERNAME', 'esign'), 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'TTE_PASSWORD', 'value' => env('TTE_PASSWORD', ''), 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'TTE_API_KEY',  'value' => env('TTE_API_KEY', ''), 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tte_configs');
    }
};
