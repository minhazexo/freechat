<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'user_id' => $this->user_id,
            'username' => $this->user?->username ?? 'System',
            'avatar' => $this->user?->avatar,
            'type' => $this->type,
            'content' => $this->getDisplayContent(),
            'is_edited' => $this->is_edited,
            'edited_at' => $this->edited_at?->toIso8601String(),
            'is_deleted' => $this->is_deleted,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
