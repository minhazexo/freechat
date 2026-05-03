<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WebRTCAnswer implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $fromUserId;
    public int $toUserId;
    public string $sdp;
    public string $type;

    public function __construct(int $chatId, int $fromUserId, int $toUserId, string $sdp, string $type)
    {
        $this->chatId = $chatId;
        $this->fromUserId = $fromUserId;
        $this->toUserId = $toUserId;
        $this->sdp = $sdp;
        $this->type = $type;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->toUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'webrtc:answer';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'from_user_id' => $this->fromUserId,
            'sdp' => $this->sdp,
            'type' => $this->type,
        ];
    }
}
