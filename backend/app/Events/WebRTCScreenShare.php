<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WebRTCScreenShare implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $fromUserId;
    public int $toUserId;
    public bool $active;

    public function __construct(int $chatId, int $fromUserId, int $toUserId, bool $active)
    {
        $this->chatId = $chatId;
        $this->fromUserId = $fromUserId;
        $this->toUserId = $toUserId;
        $this->active = $active;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->toUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'webrtc:screen-share';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'from_user_id' => $this->fromUserId,
            'active' => $this->active,
        ];
    }
}
