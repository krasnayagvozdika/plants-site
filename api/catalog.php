<?php

require __DIR__ . '/../backend/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

echo json_encode(
    catalog_repository_read($config),
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
