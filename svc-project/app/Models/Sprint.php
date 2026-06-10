<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Sprint extends Model
{
    use HasUuids;
    protected $fillable = [
        'project_id', 'name', 'goal', 'status',
        'start_date', 'end_date', 'velocity',
    ];
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function project() { return $this->belongsTo(Project::class); }
    
}
