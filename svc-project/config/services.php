<?php

return [
    'auth' => [
        'url' => env('AUTH_SERVICE_URL', 'http://svc-auth'),
    ],
    'notification' => [
        'url' => env('NOTIFICATION_SERVICE_URL', 'http://svc-notification'),
    ],
    'tte' => [
        'base_url' => env('TTE_BASE_URL', 'https://esign-dev.layanan.go.id'),
        'username' => env('TTE_USERNAME', 'esign'),
        'password' => env('TTE_PASSWORD', ''),
        'api_key'  => env('TTE_API_KEY', ''),
    ],
];
