<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\ModerationService::class);
        $this->app->singleton(\App\Services\ChatMatchingService::class);
    }

    public function boot(): void
    {
        //
    }
}
