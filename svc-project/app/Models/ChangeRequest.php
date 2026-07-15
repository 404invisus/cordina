<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChangeRequest extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'title', 'description', 'reason', 'impact',
        'priority', 'change_type', 'status',
        'requester_id', 'reviewer_id', 'signer_id',
        'reviewer_note', 'reviewed_at', 'submitted_at',
        'current_step', 'total_steps',
        'signed_document_id',
        'rincian', 'rencana_waktu', 'dependensi_layanan',
        'si_terdampak', 'langkah_mitigasi', 'risiko_tidak_dilakukan',
        'langkah_penanganan_kegagalan', 'pelaksana_ids',
    ];

    protected $casts = [
        'reviewed_at'  => 'datetime',
        'submitted_at' => 'datetime',
        'current_step'  => 'integer',
        'total_steps'   => 'integer',
        'rencana_waktu' => 'date',
        'pelaksana_ids' => 'array',
    ];

    public function approvals()
    {
        return $this->hasMany(CrApproval::class, 'cr_id')->orderBy('order');
    }

    public function currentApproval()
    {
        return $this->hasOne(CrApproval::class, 'cr_id')
            ->where('status', 'pending')
            ->orderBy('order');
    }
}
