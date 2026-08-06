<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Fold any existing 'public' rows into 'internal' before narrowing the constraint.
        DB::table('folders')->where('visibility', 'public')->update(['visibility' => 'internal']);
        DB::table('attachments')->where('visibility', 'public')->update(['visibility' => 'internal']);

        DB::statement('ALTER TABLE folders DROP CONSTRAINT folders_visibility_check');
        DB::statement("ALTER TABLE folders ADD CONSTRAINT folders_visibility_check CHECK (visibility IN ('private', 'internal'))");

        DB::statement('ALTER TABLE attachments DROP CONSTRAINT attachments_visibility_check');
        DB::statement("ALTER TABLE attachments ADD CONSTRAINT attachments_visibility_check CHECK (visibility IN ('private', 'internal'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE folders DROP CONSTRAINT folders_visibility_check');
        DB::statement("ALTER TABLE folders ADD CONSTRAINT folders_visibility_check CHECK (visibility IN ('private', 'internal', 'public'))");

        DB::statement('ALTER TABLE attachments DROP CONSTRAINT attachments_visibility_check');
        DB::statement("ALTER TABLE attachments ADD CONSTRAINT attachments_visibility_check CHECK (visibility IN ('private', 'internal', 'public'))");
    }
};
