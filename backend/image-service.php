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

    $extension = image_service_preferred_extension($imageInfo['mime']);
    $baseName = app_slugify($plantName) . '-' . date('YmdHis');
    $finalName = $baseName . '.' . $extension;
    $finalPath = rtrim($config['images']['dir'], '/') . '/' . $finalName;

    if (extension_loaded('gd')) {
        image_service_store_with_gd($config, $tmpPath, $imageInfo['mime'], $finalPath, $extension);
    } else {
        if (!move_uploaded_file($tmpPath, $finalPath)) {
            throw new RuntimeException('Не удалось сохранить изображение на сервере.');
        }
    }

    return rtrim($config['images']['web_path'], '/') . '/' . $finalName;
}

function image_service_delete_if_local(array $config, string $imagePath): void
{
    $webPrefix = rtrim($config['images']['web_path'], '/') . '/';

    if ($imagePath === '' || !str_starts_with($imagePath, $webPrefix)) {
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
    return match ($mime) {
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'jpg',
    };
}

function image_service_store_with_gd(array $config, string $tmpPath, string $mime, string $finalPath, string $extension): void
{
    $source = match ($mime) {
        'image/png' => @imagecreatefrompng($tmpPath),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmpPath) : false,
        default => @imagecreatefromjpeg($tmpPath),
    };

    if (!$source) {
        if (!move_uploaded_file($tmpPath, $finalPath)) {
            throw new RuntimeException('Не удалось подготовить изображение.');
        }
        return;
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

    $saved = match ($extension) {
        'png' => imagepng($target, $finalPath, 6),
        'webp' => function_exists('imagewebp')
            ? imagewebp($target, $finalPath, (int) ($config['images']['webp_quality'] ?? 80))
            : imagejpeg($target, preg_replace('/\.webp$/', '.jpg', $finalPath) ?: $finalPath, (int) ($config['images']['jpeg_quality'] ?? 82)),
        default => imagejpeg($target, $finalPath, (int) ($config['images']['jpeg_quality'] ?? 82)),
    };

    imagedestroy($source);
    imagedestroy($target);

    if (!$saved) {
        throw new RuntimeException('Не удалось сохранить обработанное изображение.');
    }
}
