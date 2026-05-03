<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WebRTCIceCandidate implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $fromUserId;
    public int $toUserId;
    public string $candidate;
    public ?string $sdpMid;
    public ?int $sdpMLineIndex;

    public function __construct(
        int $chatId,
        int $fromUserId,
        int $toUserId,
        string $candidate,
        ?string $sdpMid = null,
        ?int $sdpMLineIndex = null
    ) {
        $this->chatId = $chatId;
        $this->fromUserId = $fromUserId;
        $this->toUserId = $toUserId;
        $this->candidate = $candidate;
        $this->sdpMid = $sdpMid;
        $this->sdpMLineIndex = $sdpMLineIndex;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->toUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'webrtc:ice-candidate';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'from_user_id' => $this->fromUserId,
            'candidate' => $this->candidate,
            'sdp_mid' => $this->sdpMid,
            'sdp_m_line_index' => $this->sdpMLineIndex,
        ];
    }
}
