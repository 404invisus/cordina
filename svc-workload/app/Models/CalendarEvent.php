<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalendarEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'title', 'description', 'type', 'visibility',
        'start_date', 'end_date', 'start_time', 'end_time',
        'all_day', 'location', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'all_day'    => 'boolean',
    ];

    public function participants(): HasMany
    {
        return $this->hasMany(CalendarEventParticipant::class, 'event_id');
    }
}
