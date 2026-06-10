<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class SprintResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'project_id' => $this->project_id,
            'name'       => $this->name,
            'goal'       => $this->goal,
            'status'     => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date'   => $this->end_date?->toDateString(),
            'velocity'   => $this->velocity,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
