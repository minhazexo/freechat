<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \App\Events\ChatMessageSent::class => [],
        \App\Events\ChatTyping::class => [],
        \App\Events\ChatStarted::class => [],
        \App\Events\ChatEnded::class => [],
        \App\Events\WebRTCOffer::class => [],
        \App\Events\WebRTCAnswer::class => [],
        \App\Events\WebRTCIceCandidate::class => [],
        \App\Events\WebRTCToggleMedia::class => [],
        \App\Events\WebRTCScreenShare::class => [],
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
