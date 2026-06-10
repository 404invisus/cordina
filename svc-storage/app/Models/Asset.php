<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Asset extends Model
{
    use SoftDeletes;
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'name', 'category', 'serial_number', 'condition',
        'location', 'acquired_at', 'value', 'responsible_user_id',
        'notes', 'created_by',
    ];
    protected $casts = ['acquired_at' => 'date', 'value' => 'decimal:2'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id = (string) Str::uuid());
    }
}
