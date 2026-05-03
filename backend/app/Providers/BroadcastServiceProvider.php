<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Custom broadcasting auth routes are defined in api.php
        // Just load the channel definitions
        require base_path('routes/channels.php');
    }
}
