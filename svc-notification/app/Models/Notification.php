<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuids;
    protected $fillable = [
        'user_id', 'type', 'payload', 'channel',
        'status', 'sent_at', 'error_message',
    ];
    protected $casts = [
        'payload' => 'array',
        'sent_at' => 'datetime',
    ];
}
