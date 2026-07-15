<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    use HasUuids;
    protected $fillable = [
        'epic_id', 'sprint_id', 'title', 'description',
        'status', 'story_points', 'priority', 'assignee_id',
        'due_date', 'estimated_hours', 'type',
    ];

    public function epic()     { return $this->belongsTo(Epic::class); }
    public function sprint()   { return $this->belongsTo(Sprint::class); }
    public function tasks()    { return $this->hasMany(Task::class); }
}
