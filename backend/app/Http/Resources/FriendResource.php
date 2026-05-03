<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FriendResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isIncoming = $this->friend_id === $request->user()?->id;
        $otherUser = $isIncoming ? $this->user : $this->friend;

        return [
            'id' => $this->id,
            'user_id' => $otherUser?->id,
            'username' => $otherUser?->username,
            'avatar' => $otherUser?->avatar,
            'is_online' => $otherUser?->is_online,
            'status' => $this->status,
            'is_incoming' => $isIncoming,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
