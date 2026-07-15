<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'full_name'        => $this->full_name,
            'email'            => $this->email,
            'roles'            => $this->getRoleNames(),
            'division'         => $this->division,
            'position'         => $this->position,
            'telegram_chat_id' => $this->telegram_chat_id,
            'nik'              => $this->nik,
            'tte_specimen_url' => $this->tte_specimen_url,
            'avatar'           => $this->avatar,
            'is_active'        => $this->is_active,
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}
