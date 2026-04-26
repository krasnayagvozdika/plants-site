<?php

session_start();

$config = require __DIR__ . '/config.php';

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog-repository.php';
require_once __DIR__ . '/image-service.php';
