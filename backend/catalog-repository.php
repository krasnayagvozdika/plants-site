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
            'categories' => [],
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
            'categories' => [],
            'items' => [],
        ];
    }

    $data['items'] = is_array($data['items'] ?? null) ? $data['items'] : [];
    $data['categories'] = catalog_repository_normalize_categories($data);

    return $data;
}

function catalog_repository_write(array $config, array $data): void
{
    $path = $config['catalog']['file'];
    catalog_repository_ensure_file($path);

    $data['updated_at'] = app_now_msk_iso();
    $data['categories'] = catalog_repository_normalize_categories($data);
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

function catalog_repository_normalize_categories(array $catalog): array
{
    $categories = [];

    foreach (($catalog['categories'] ?? []) as $category) {
        $category = trim((string) $category);
        if ($category !== '' && !in_array($category, $categories, true)) {
            $categories[] = $category;
        }
    }

    foreach (($catalog['items'] ?? []) as $item) {
        $category = trim((string) ($item['category'] ?? ''));
        if ($category !== '' && !in_array($category, $categories, true)) {
            $categories[] = $category;
        }
    }

    sort($categories, SORT_NATURAL | SORT_FLAG_CASE);

    return $categories;
}

function catalog_repository_add_category(array $config, string $name): void
{
    $name = trim($name);
    if ($name === '') {
        throw new RuntimeException('Название категории обязательно.');
    }

    $catalog = catalog_repository_read($config);

    if (in_array($name, $catalog['categories'], true)) {
        throw new RuntimeException('Такая категория уже существует.');
    }

    $catalog['categories'][] = $name;
    catalog_repository_write($config, $catalog);
}

function catalog_repository_rename_category(array $config, string $oldName, string $newName): void
{
    $oldName = trim($oldName);
    $newName = trim($newName);

    if ($oldName === '' || $newName === '') {
        throw new RuntimeException('Старая и новая категории обязательны.');
    }

    $catalog = catalog_repository_read($config);

    if (!in_array($oldName, $catalog['categories'], true)) {
        throw new RuntimeException('Исходная категория не найдена.');
    }

    if ($oldName !== $newName && in_array($newName, $catalog['categories'], true)) {
        throw new RuntimeException('Категория с таким названием уже существует.');
    }

    foreach ($catalog['items'] as $index => $item) {
        if (($item['category'] ?? '') === $oldName) {
            $catalog['items'][$index]['category'] = $newName;
        }
    }

    foreach ($catalog['categories'] as $index => $category) {
        if ($category === $oldName) {
            $catalog['categories'][$index] = $newName;
        }
    }

    catalog_repository_write($config, $catalog);
}
