<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WebRTCToggleMedia implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $fromUserId;
    public int $toUserId;
    public string $mediaType;
    public bool $enabled;

    public function __construct(int $chatId, int $fromUserId, int $toUserId, string $mediaType, bool $enabled)
    {
        $this->chatId = $chatId;
        $this->fromUserId = $fromUserId;
        $this->toUserId = $toUserId;
        $this->mediaType = $mediaType;
        $this->enabled = $enabled;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->toUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'webrtc:toggle-media';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'from_user_id' => $this->fromUserId,
            'media_type' => $this->mediaType,
            'enabled' => $this->enabled,
        ];
    }
}
