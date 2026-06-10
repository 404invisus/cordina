<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProjectMember extends Model
{
    use HasUuids;
    protected $fillable = ['project_id', 'user_id', 'role', 'joined_at'];
    protected $casts    = ['joined_at' => 'datetime'];

    public function project() { return $this->belongsTo(Project::class); }
}
