<?php
return [
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'project' => [
        'url' => env('PROJECT_SERVICE_URL', 'http://svc-project'),
    ],
    'auth' => [
        'url' => env('AUTH_SERVICE_URL', 'http://svc-auth'),
    ],
    'notification' => [
        'url' => env('NOTIFICATION_SERVICE_URL', 'http://svc-notification'),
    ],
];
