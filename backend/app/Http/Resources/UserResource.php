<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->when(!$this->is_anonymous, $this->email),
            'avatar' => $this->avatar,
            'is_anonymous' => $this->is_anonymous,
            'is_online' => $this->is_online,
            'is_banned' => $this->is_banned,
            'ban_reason' => $this->when($this->is_banned, $this->ban_reason),
            'banned_until' => $this->when($this->banned_until, $this->banned_until?->toIso8601String()),
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'interests' => $this->interests ?? [],
            'preferences' => $this->preferences ?? [],
            'warning_count' => $this->warning_count,
            'is_admin' => $this->isAdmin(),
            'friends_count' => $this->whenCounted('friends'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
