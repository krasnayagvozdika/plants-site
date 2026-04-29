<?php

function image_service_ensure_dir(array $config): void
{
    $dir = $config['images']['dir'];

    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

function image_service_store_uploaded_file(array $config, array $file, string $plantName): string
{
    image_service_ensure_dir($config);

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Не удалось загрузить изображение.');
    }

    $tmpPath = $file['tmp_name'] ?? '';
    $imageInfo = @getimagesize($tmpPath);

    if (!$imageInfo || !isset($imageInfo['mime'])) {
        throw new RuntimeException('Файл изображения не распознан.');
    }

    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($imageInfo['mime'], $allowedMimeTypes, true)) {
        throw new RuntimeException('Поддерживаются только JPG, PNG и WEBP.');
    }

    if (!extension_loaded('gd')) {
        throw new RuntimeException('На хостинге не включено расширение PHP GD. Загрузка изображений невозможна.');
    }

    $extension = image_service_preferred_extension($imageInfo['mime']);
    $baseName = app_slugify($plantName) . '-' . date('YmdHis') . '-' . image_service_random_suffix();
    $finalName = $baseName . '.' . $extension;
    $finalPath = rtrim($config['images']['dir'], '/') . '/' . $finalName;

    $finalPath = image_service_store_with_gd($config, $tmpPath, $imageInfo['mime'], $finalPath, $extension);
    $finalName = basename($finalPath);

    return rtrim($config['images']['web_path'], '/') . '/' . $finalName;
}

function image_service_delete_if_local(array $config, string $imagePath): void
{
    $webPrefix = rtrim($config['images']['web_path'], '/') . '/';

    if ($imagePath === '' || substr($imagePath, 0, strlen($webPrefix)) !== $webPrefix) {
        return;
    }

    $fileName = basename($imagePath);
    $fullPath = rtrim($config['images']['dir'], '/') . '/' . $fileName;

    if (is_file($fullPath)) {
        unlink($fullPath);
    }
}

function image_service_preferred_extension(string $mime): string
{
    switch ($mime) {
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        default:
            return 'jpg';
    }
}

function image_service_store_with_gd(array $config, string $tmpPath, string $mime, string $finalPath, string $extension): string
{
    switch ($mime) {
        case 'image/png':
            $source = @imagecreatefrompng($tmpPath);
            break;
        case 'image/webp':
            $source = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmpPath) : false;
            break;
        default:
            $source = @imagecreatefromjpeg($tmpPath);
            break;
    }

    if (!$source) {
        throw new RuntimeException('Не удалось подготовить изображение через GD.');
    }

    $width = imagesx($source);
    $height = imagesy($source);
    $maxWidth = (int) ($config['images']['max_width'] ?? 1600);

    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = (int) round(($height / $width) * $newWidth);
    } else {
        $newWidth = $width;
        $newHeight = $height;
    }

    $target = imagecreatetruecolor($newWidth, $newHeight);

    if (in_array($extension, ['png', 'webp'], true)) {
        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
        imagefilledrectangle($target, 0, 0, $newWidth, $newHeight, $transparent);
    }

    imagecopyresampled($target, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $actualFinalPath = $finalPath;

    if ($extension === 'webp' && !function_exists('imagewebp')) {
        $actualFinalPath = preg_replace('/\.webp$/', '.jpg', $finalPath) ?: $finalPath;
    }

    switch ($extension) {
        case 'png':
            $saved = imagepng($target, $finalPath, 6);
            break;
        case 'webp':
            $saved = function_exists('imagewebp')
                ? imagewebp($target, $actualFinalPath, (int) ($config['images']['webp_quality'] ?? 80))
                : imagejpeg($target, $actualFinalPath, (int) ($config['images']['jpeg_quality'] ?? 82));
            break;
        default:
            $saved = imagejpeg($target, $finalPath, (int) ($config['images']['jpeg_quality'] ?? 82));
            break;
    }

    imagedestroy($source);
    imagedestroy($target);

    if (!$saved) {
        throw new RuntimeException('Не удалось сохранить обработанное изображение.');
    }

    return $actualFinalPath;
}

function image_service_random_suffix(): string
{
    try {
        return bin2hex(random_bytes(3));
    } catch (Throwable $exception) {
        return substr(md5(uniqid('', true)), 0, 6);
    }
}
