<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Attendance extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'user_id', 'date', 'type', 'work_mode', 'time',
        'latitude', 'longitude', 'distance_from_office', 'status',
        'file_path', 'file_name', 'mime_type', 'file_size', 'notes',
    ];
    protected $casts = ['date' => 'date'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id = (string) Str::uuid());
    }
}
