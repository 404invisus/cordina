<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'status'      => $this->status,
            'owner_id'    => $this->owner_id,
            'start_date'  => $this->start_date?->toDateString(),
            'end_date'    => $this->end_date?->toDateString(),
            'settings'    => $this->settings,
            'members'     => $this->whenLoaded('members'),
            'sprints'     => $this->whenLoaded('sprints'),
            'epics'       => $this->whenLoaded('epics'),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
