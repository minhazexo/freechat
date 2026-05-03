<?php

$pusherHost = env('PUSHER_HOST') ?: null;
$pusherScheme = env('PUSHER_SCHEME', $pusherHost ? 'http' : 'https');

$pusherOptions = [
    'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
    'encrypted' => $pusherScheme === 'https',
    'useTLS' => $pusherScheme === 'https',
];

if ($pusherHost) {
    $pusherOptions['host'] = $pusherHost;
    $pusherOptions['port'] = env('PUSHER_PORT', 6001);
    $pusherOptions['scheme'] = $pusherScheme;
}

return [
    'default' => env('BROADCAST_DRIVER', 'pusher'),
    'connections' => [
        'pusher' => [
            'driver' => 'pusher',
            // For local development it's convenient to have defaults. In production, always set these explicitly.
            'key' => env('PUSHER_APP_KEY') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-key'),
            'secret' => env('PUSHER_APP_SECRET') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-secret'),
            'app_id' => env('PUSHER_APP_ID') ?: ((env('APP_ENV') === 'production') ? null : 'chitchat-app'),
            'options' => $pusherOptions,
            'client_options' => [],
        ],
        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
        'log' => [
            'driver' => 'log',
        ],
        'null' => [
            'driver' => 'null',
        ],
    ],
];
