<?php

$frontendUrl = env('APP_FRONTEND_URL', 'http://localhost:5173');
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', $frontendUrl)))));

if (env('APP_ENV') !== 'production') {
    $allowedOrigins = array_values(array_unique(array_merge($allowedOrigins, [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ])));
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
