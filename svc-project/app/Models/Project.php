<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name', 'description', 'status',
        'owner_id', 'start_date', 'end_date', 'settings',
    ];

    protected $casts = [
        'settings'   => 'array',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function sprints() { return $this->hasMany(Sprint::class); }
    public function epics()   { return $this->hasMany(Epic::class); }
    public function members() { return $this->hasMany(ProjectMember::class); }
}
