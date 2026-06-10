<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\Sprint;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'story_id', 'sprint_id', 'parent_task_id',
        'title', 'description', 'type',
        'status', 'priority', 'severity',
        'assignee_id', 'reporter_id',
        'estimated_hours', 'actual_hours',
        'due_date', 'custom_fields',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'due_date'      => 'date',
    ];

    public function story()      { return $this->belongsTo(Story::class); }
    public function subtasks()   { return $this->hasMany(Task::class, 'parent_task_id'); }
    public function parent()     { return $this->belongsTo(Task::class, 'parent_task_id'); }
    public function blockedBy()  { return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id'); }
    public function blocks()     { return $this->belongsToMany(Task::class, 'task_dependencies', 'depends_on_task_id', 'task_id'); }
    public function assignees()   { return $this->hasMany(\App\Models\TaskAssignee::class); }
    public function comments()   { return $this->hasMany(Comment::class); }
    public function attachments(){ return $this->hasMany(Attachment::class); }
    public function timeLogs()   { return $this->hasMany(TimeLog::class); }
}
