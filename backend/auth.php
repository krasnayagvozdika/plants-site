<?php

function auth_is_logged_in(): bool
{
    return !empty($_SESSION['admin_logged_in']);
}

function auth_require_login(): void
{
    if (!auth_is_logged_in()) {
        app_redirect('/admin/login.php');
    }
}

function auth_attempt_login(array $config, string $username, string $password): bool
{
    $expectedUsername = $config['admin']['username'] ?? '';
    $expectedPassword = $config['admin']['password'] ?? '';

    if ($username !== $expectedUsername || $password !== $expectedPassword) {
        return false;
    }

    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_username'] = $expectedUsername;

    return true;
}

function auth_logout(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
}
