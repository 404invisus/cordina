<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'description'      => $this->description,
            'type'             => $this->type,
            'status'           => $this->status,
            'priority'         => $this->priority,
            'severity'         => $this->severity,
            'story_id'         => $this->story_id,
            'sprint_id'        => $this->sprint_id,
            'project_id'       => $this->sprint_id ? \App\Models\Sprint::find($this->sprint_id)?->project_id : null,
            'parent_task_id'   => $this->parent_task_id,
            'assignee_id'      => $this->assignee_id,
            'reporter_id'      => $this->reporter_id,
            'estimated_hours'  => $this->estimated_hours,
            'actual_hours'     => $this->actual_hours,
            'due_date'         => $this->due_date?->toDateString(),
            'custom_fields'    => $this->custom_fields,
            'subtasks'         => TaskResource::collection($this->whenLoaded('subtasks')),
            'blocked_by'       => $this->whenLoaded('blockedBy'),
            'blocks'           => $this->whenLoaded('blocks'),
            'comments'         => $this->whenLoaded('comments'),
            'time_logs'        => $this->whenLoaded('timeLogs'),
            'created_at'       => $this->created_at?->toIso8601String(),
            'updated_at'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
