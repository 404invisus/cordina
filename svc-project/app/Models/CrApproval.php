<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CrApproval extends Model
{
    use HasUuids;

    protected $fillable = [
        'cr_id', 'approver_id', 'role', 'order', 'status', 'note', 'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
        'order'    => 'integer',
    ];

    public function changeRequest()
    {
        return $this->belongsTo(ChangeRequest::class, 'cr_id');
    }
}
