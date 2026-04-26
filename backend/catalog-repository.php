<?php

function catalog_repository_ensure_file(string $path): void
{
    $dir = dirname($path);

    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    if (!file_exists($path)) {
        $seed = [
            'updated_at' => app_now_msk_iso(),
            'items' => [],
        ];

        file_put_contents(
            $path,
            json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
    }
}

function catalog_repository_read(array $config): array
{
    $path = $config['catalog']['file'];
    catalog_repository_ensure_file($path);

    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '', true);

    if (!is_array($data)) {
        return [
            'updated_at' => app_now_msk_iso(),
            'items' => [],
        ];
    }

    $data['items'] = is_array($data['items'] ?? null) ? $data['items'] : [];

    return $data;
}

function catalog_repository_write(array $config, array $data): void
{
    $path = $config['catalog']['file'];
    catalog_repository_ensure_file($path);

    $data['updated_at'] = app_now_msk_iso();
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    file_put_contents($path, $json . PHP_EOL, LOCK_EX);
}

function catalog_repository_next_id(array $catalog): string
{
    $max = 0;

    foreach ($catalog['items'] as $item) {
        $id = (int) ($item['id'] ?? 0);
        if ($id > $max) {
            $max = $id;
        }
    }

    return str_pad((string) ($max + 1), 4, '0', STR_PAD_LEFT);
}

function catalog_repository_add_item(array $config, array $item): void
{
    $catalog = catalog_repository_read($config);
    $catalog['items'][] = $item;
    catalog_repository_write($config, $catalog);
}

function catalog_repository_find_item(array $catalog, string $id): ?array
{
    foreach ($catalog['items'] as $item) {
        if ((string) ($item['id'] ?? '') === $id) {
            return $item;
        }
    }

    return null;
}

function catalog_repository_update_item(array $config, string $id, array $payload): void
{
    $catalog = catalog_repository_read($config);

    foreach ($catalog['items'] as $index => $item) {
        if ((string) ($item['id'] ?? '') !== $id) {
            continue;
        }

        $catalog['items'][$index] = array_merge($item, $payload, ['id' => $id]);
        catalog_repository_write($config, $catalog);
        return;
    }

    throw new RuntimeException('Позиция для обновления не найдена.');
}

function catalog_repository_delete_item(array $config, string $id): ?array
{
    $catalog = catalog_repository_read($config);

    foreach ($catalog['items'] as $index => $item) {
        if ((string) ($item['id'] ?? '') !== $id) {
            continue;
        }

        $deleted = $item;
        array_splice($catalog['items'], $index, 1);
        catalog_repository_write($config, $catalog);
        return $deleted;
    }

    return null;
}
