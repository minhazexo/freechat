<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Chat $chat;
    public int $recipientId;
    public ?string $reason;

    public function __construct(Chat $chat, int $recipientId, ?string $reason = null)
    {
        $this->chat = $chat;
        $this->recipientId = $recipientId;
        $this->reason = $reason;
    }

    public function broadcastOn(): array
    {
        // Only broadcast on the presence channel — both participants are already
        // subscribed to it. The private channel is redundant since chat:ended
        // is handled via subscribeToChat, not subscribeToUser.
        return [
            new PresenceChannel('chat.' . $this->chat->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'chat:ended';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat->id,
            'reason' => $this->reason,
            'ended_at' => now()->toIso8601String(),
        ];
    }
}
