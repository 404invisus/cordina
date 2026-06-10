<?php

return [
    'auth' => [
        'url' => env('AUTH_SERVICE_URL', 'http://svc-auth'),
    ],
    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'group_chat_id' => env('TELEGRAM_GROUP_CHAT_ID', '-5236090219'),
    ],
];
