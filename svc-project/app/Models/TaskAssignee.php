<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TaskAssignee extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['task_id', 'user_id'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id = (string) Str::uuid());
    }
}
