<?php

return [
    'admin' => [
        'username' => 'admin',
        'password' => 'change-me-now',
    ],
    'catalog' => [
        'file' => __DIR__ . '/../data/catalog.json',
    ],
    'images' => [
        'dir' => __DIR__ . '/../images/catalog',
        'web_path' => 'images/catalog',
        'max_width' => 1600,
        'jpeg_quality' => 82,
        'webp_quality' => 80,
    ],
];
