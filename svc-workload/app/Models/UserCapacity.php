<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserCapacity extends Model
{
    use HasUuids;
    protected $fillable = ['sprint_id', 'user_id', 'available_hours', 'allocated_hours'];
    protected $casts    = ['available_hours' => 'float', 'allocated_hours' => 'float'];
}
