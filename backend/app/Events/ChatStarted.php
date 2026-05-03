<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Chat $chat;
    public int $recipientId;

    public function __construct(Chat $chat, int $recipientId)
    {
        $this->chat = $chat;
        $this->recipientId = $recipientId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->recipientId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'chat:started';
    }

    public function broadcastWith(): array
    {
        $otherParticipant = $this->chat->participants->first(fn($p) => $p->id !== $this->recipientId);

        return [
            'chat_id' => $this->chat->id,
            'type' => $this->chat->type,
            'interests' => $this->chat->interests,
            'other_user' => $otherParticipant ? [
                'id' => $otherParticipant->id,
                'username' => $otherParticipant->username,
                'avatar' => $otherParticipant->avatar,
            ] : null,
            'started_at' => $this->chat->started_at->toIso8601String(),
        ];
    }
}
