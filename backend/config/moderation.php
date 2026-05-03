<?php

return [
    'enabled' => env('MODERATION_ENABLED', true),
    'bad_words' => explode(',', env('MODERATION_BAD_WORDS_LIST', 'profanity,spam,abuse')),
    'max_warnings' => 3,
    'auto_ban_duration' => 24 * 60, // minutes (24 hours)
    'sensitive_patterns' => [
        'email' => '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/',
        'phone' => '/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/',
        'url' => '/(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/',
    ],
];
