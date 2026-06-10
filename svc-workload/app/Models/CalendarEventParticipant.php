<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEventParticipant extends Model
{
    use HasUuids;

    protected $fillable = [
        'event_id', 'user_id', 'status', 'assigned_by',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(CalendarEvent::class, 'event_id');
    }
}
