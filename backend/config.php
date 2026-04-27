<?php

$configFile = __DIR__ . '/config.local.php';

if (file_exists($configFile)) {
    return require $configFile;
}

return [
    'admin' => [
        'username' => 'admin',
        'password' => 'admin111',
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
