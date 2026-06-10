<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create("calendar_events", function (Blueprint $table) {
            $table->uuid("id")->primary()->default(\DB::raw("gen_random_uuid()"));
            $table->uuid("user_id");
            $table->string("title");
            $table->text("description")->nullable();
            $table->enum("type", ["internal", "external", "cuti", "lainnya"])->default("internal");
            $table->enum("visibility", ["public", "private"])->default("public");
            $table->date("start_date");
            $table->date("end_date");
            $table->time("start_time")->nullable();
            $table->time("end_time")->nullable();
            $table->boolean("all_day")->default(true);
            $table->string("location")->nullable();
            $table->uuid("created_by");
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists("calendar_events");
    }
};
