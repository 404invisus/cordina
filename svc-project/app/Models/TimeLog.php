<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TimeLog extends Model
{
    use HasUuids;
    protected $fillable = ['task_id', 'user_id', 'logged_hours', 'description', 'logged_at'];
    protected $casts    = ['logged_at' => 'date'];

    public function task() { return $this->belongsTo(Task::class); }
}
