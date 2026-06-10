<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ChangeRequest extends Model
{
    use SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title', 'description', 'reason', 'impact',
        'priority', 'change_type', 'status',
        'requester_id', 'reviewer_id', 'reviewer_note',
        'reviewed_at', 'submitted_at',
    ];

    protected $casts = [
        'reviewed_at'  => 'datetime',
        'submitted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id = (string) Str::uuid());
    }
}
