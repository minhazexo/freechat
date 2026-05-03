<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'type' => $this->type,
            'other_user' => $this->otherUser ? [
                'id' => $this->otherUser->id,
                'username' => $this->otherUser->username,
                'avatar' => $this->otherUser->avatar,
            ] : null,
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'duration_seconds' => $this->duration_seconds,
            'duration_formatted' => $this->getDurationFormatted(),
            'message_count' => $this->message_count,
            'was_friend_added' => $this->was_friend_added,
            'was_reported' => $this->was_reported,
            'rating' => $this->rating,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
