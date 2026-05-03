<?php

return [
    'dashboard' => [
        'port' => env('LARAVEL_WEBSOCKETS_PORT', 6001),
    ],
    'apps' => [
        [
            'id' => env('PUSHER_APP_ID') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-app'),
            'name' => env('APP_NAME', 'Chitchat'),
            'key' => env('PUSHER_APP_KEY') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-key'),
            'secret' => env('PUSHER_APP_SECRET') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-secret'),
            'path' => null,
            'capacity' => null,
            'enable_client_messages' => false,
            'enable_statistics' => false,
        ],
    ],
    'app_provider' => BeyondCode\LaravelWebSockets\Apps\ConfigAppProvider::class,
    'allowed_origins' => [],
    'max_request_size_in_kb' => 250,
    'path' => 'laravel-websockets',
    'middleware' => [
        'web',
    ],
    'statistics' => [
        'model' => BeyondCode\LaravelWebSockets\Statistics\Models\WebSocketsStatisticsEntry::class,
        'interval_in_seconds' => 999999,
        'delete_statistics_older_than_days' => 60,
    ],
    'ssl' => [
        'local_cert' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_CERT', null),
        'local_pk' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_PK', null),
        'passphrase' => env('LARAVEL_WEBSOCKETS_SSL_PASSPHRASE', null),
        'verify_peer' => false,
    ],
    'channel_manager' => BeyondCode\LaravelWebSockets\WebSockets\Channels\ChannelManagers\ArrayChannelManager::class,
];
