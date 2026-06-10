<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Comment extends Model
{
    use HasUuids, SoftDeletes;
    protected $fillable = ['task_id', 'user_id', 'author_name', 'content', 'mentions'];
    protected $casts    = ['mentions' => 'array'];
    public function task() { return $this->belongsTo(Task::class); }
}
