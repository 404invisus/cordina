<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserNotificationSetting extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'channel', 'event_type', 'enabled'];
    protected $casts    = ['enabled' => 'boolean'];
}
