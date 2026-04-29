<?php

if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_NONE) {
    $sessionPath = dirname(__DIR__) . '/data/sessions';

    if (!is_dir($sessionPath)) {
        @mkdir($sessionPath, 0775, true);
    }

    if (is_dir($sessionPath) && is_writable($sessionPath)) {
        session_save_path($sessionPath);
    }

    session_start();
}

if (PHP_SAPI !== 'cli') {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
}

$config = require __DIR__ . '/config.php';

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog-repository.php';
require_once __DIR__ . '/config-writer.php';
require_once __DIR__ . '/image-service.php';
