<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Epic extends Model
{
    use HasUuids;
    protected $fillable = ['project_id', 'title', 'description', 'status', 'color', 'start_date', 'end_date'];
    protected $casts    = ['start_date' => 'date', 'end_date' => 'date'];

    public function project()
    {
        return $this->belongsTo(\App\Models\Project::class);
    }

    public function stories() { return $this->hasMany(Story::class); }
}
