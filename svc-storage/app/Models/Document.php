<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Document extends Model
{
    use SoftDeletes;
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'title', 'category', 'doc_number', 'issued_at', 'expires_at',
        'file_path', 'file_name', 'mime_type', 'file_size',
        'version', 'description', 'created_by',
    ];
    protected $casts = ['issued_at' => 'date', 'expires_at' => 'date'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id = (string) Str::uuid());
    }
}
