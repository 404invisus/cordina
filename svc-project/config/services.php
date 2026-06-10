<?php

return [
    'auth' => [
        'url' => env('AUTH_SERVICE_URL', 'http://svc-auth'),
    ],
    'notification' => [
        'url' => env('NOTIFICATION_SERVICE_URL', 'http://svc-notification'),
    ],
];
