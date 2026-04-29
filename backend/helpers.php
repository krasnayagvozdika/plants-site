<?php

function app_base_path(): string
{
    $scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '');

    foreach (['/admin/', '/api/'] as $marker) {
        $position = strpos($scriptName, $marker);

        if ($position !== false) {
            return rtrim(substr($scriptName, 0, $position), '/');
        }
    }

    return '';
}

function app_url(string $path): string
{
    if (preg_match('/^https?:\/\//', $path)) {
        return $path;
    }

    $basePath = app_base_path();
    $path = '/' . ltrim($path, '/');

    return $basePath . $path;
}

function app_redirect(string $path): void
{
    header('Location: ' . app_url($path));
    exit;
}

function app_is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function app_h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function app_slugify(string $value): string
{
    $value = app_lower(trim($value));
    $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',
        'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm',
        'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'h', 'ц' => 'cz', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'shh',
        'ъ' => '', 'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];

    $value = strtr($value, $map);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    $value = trim($value, '-');

    return $value !== '' ? $value : 'plant';
}

function app_lower(string $value): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }

    return strtolower($value);
}

function app_now_msk_iso(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow')))->format(DateTimeInterface::ATOM);
}

function app_format_admin_datetime(?string $value): string
{
    if (!$value) {
        return '';
    }

    try {
        $date = new DateTimeImmutable($value);
        $date = $date->setTimezone(new DateTimeZone('Europe/Moscow'));
        return $date->format('d.m.Y H:i') . ' (МСК)';
    } catch (Throwable $exception) {
        return $value;
    }
}
