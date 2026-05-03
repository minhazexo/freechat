<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $otherParticipant = $user ? $this->getOtherParticipant($user) : null;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'end_reason' => $this->end_reason,
            'interests' => $this->interests ?? [],
            'other_user' => $otherParticipant ? [
                'id' => $otherParticipant->id,
                'username' => $otherParticipant->username,
                'avatar' => $otherParticipant->avatar,
                'is_online' => $otherParticipant->is_online,
            ] : null,
            'participants' => $this->when($request->routeIs('admin.*'), 
                UserResource::collection($this->participants)
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
