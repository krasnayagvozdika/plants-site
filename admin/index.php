<?php

require __DIR__ . '/../backend/bootstrap.php';

auth_require_login();

$catalog = catalog_repository_read($config);
$items = $catalog['items'];
$message = '';
$error = '';
$editingId = isset($_GET['edit']) ? trim((string) $_GET['edit']) : '';
$editingItem = $editingId !== '' ? catalog_repository_find_item($catalog, $editingId) : null;
$isCreateMode = isset($_GET['create']);
$isFormOpen = $editingItem !== null || $isCreateMode || $error !== '';
$categories = [];
foreach ($items as $item) {
    $category = trim((string) ($item['category'] ?? ''));
    if ($category !== '' && !in_array($category, $categories, true)) {
        $categories[] = $category;
    }
}
sort($categories, SORT_NATURAL | SORT_FLAG_CASE);
$types = [
    'pot' => 'в горшке',
    'ground' => 'в грунте',
    'cut' => 'под срезку',
];

if (app_is_post() && (string) ($_POST['action'] ?? '') === 'delete') {
    try {
        $deleteId = trim((string) ($_POST['id'] ?? ''));
        $deleted = catalog_repository_delete_item($config, $deleteId);

        if (!$deleted) {
            throw new RuntimeException('Позиция для удаления не найдена.');
        }

        image_service_delete_if_local($config, (string) ($deleted['image'] ?? ''));
        $catalog = catalog_repository_read($config);
        $items = $catalog['items'];
        $message = 'Позиция удалена.';
        $editingId = '';
        $editingItem = null;
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}

if (app_is_post() && (string) ($_POST['action'] ?? 'save') === 'save') {
    try {
        $itemId = trim((string) ($_POST['id'] ?? ''));
        $name = trim((string) ($_POST['name'] ?? ''));
        $price = trim((string) ($_POST['price'] ?? ''));
        $category = trim((string) ($_POST['category'] ?? ''));
        $type = trim((string) ($_POST['type'] ?? ''));
        $size = trim((string) ($_POST['size'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $available = trim((string) ($_POST['available'] ?? ''));
        $currentImage = trim((string) ($_POST['current_image'] ?? ''));

        if ($name === '' || $category === '') {
            throw new RuntimeException('Название и категория обязательны.');
        }

        $imagePath = $currentImage;
        if (!empty($_FILES['image']['name'])) {
            $imagePath = image_service_store_uploaded_file($config, $_FILES['image'], $name);
            image_service_delete_if_local($config, $currentImage);
        }

        $item = [
            'name' => $name,
            'price' => $price,
            'image' => $imagePath,
            'category' => $category,
            'type' => $type,
            'size' => $size,
            'description' => $description,
            'available' => $available,
        ];

        if ($itemId !== '') {
            catalog_repository_update_item($config, $itemId, $item);
            $message = 'Позиция обновлена.';
        } else {
            $item['id'] = catalog_repository_next_id($catalog);
            catalog_repository_add_item($config, $item);
            $message = 'Позиция добавлена в локальный каталог.';
        }

        $catalog = catalog_repository_read($config);
        $items = $catalog['items'];
        $editingId = '';
        $editingItem = null;
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Админка каталога</title>
  <link rel="stylesheet" href="/style.css">
  <script defer src="/admin/admin.js"></script>
</head>
<body>
  <main class="page">
    <div class="container page-wrap">
      <section class="page-card">
        <div class="page-intro">
          <span class="page-kicker">Администрирование</span>
          <h1 class="page-title">Каталог растений</h1>
          <p class="page-lead">Управление локальным каталогом: товары хранятся в `data/catalog.json`, фотографии в `images/catalog/`.</p>
        </div>

        <div class="info-grid">
          <article class="info-item">
            <h2>Позиций</h2>
            <p><?= app_h((string) count($items)) ?></p>
          </article>
          <article class="info-item">
            <h2>Обновлено</h2>
            <p><?= app_h(app_format_admin_datetime((string) ($catalog['updated_at'] ?? ''))) ?></p>
          </article>
        </div>

        <?php if ($message !== ''): ?>
          <div class="empty empty-search">
            <p><?= app_h($message) ?></p>
          </div>
        <?php endif; ?>

        <?php if ($error !== ''): ?>
          <div class="empty empty-search">
            <p><?= app_h($error) ?></p>
          </div>
        <?php endif; ?>

        <div class="content-block">
          <div class="admin-toolbar">
            <h2>Текущие позиции</h2>
            <div class="admin-toolbar-actions">
              <input class="catalog-search-input admin-search" type="search" placeholder="Поиск по названию или категории" data-admin-search>
              <a class="btn btn-primary" href="/admin/index.php?create=1">Добавить позицию</a>
            </div>
          </div>
          <?php if (!$items): ?>
            <p>Каталог пока пуст.</p>
          <?php else: ?>
            <div class="admin-list">
              <?php foreach ($items as $item): ?>
                <article
                  class="info-item admin-list-item"
                  data-admin-item
                  data-name="<?= app_h($item['name'] ?? '') ?>"
                  data-category="<?= app_h($item['category'] ?? '') ?>"
                >
                  <?php if (!empty($item['image'])): ?>
                    <img class="admin-item-thumb" src="/<?= app_h(ltrim($item['image'], '/')) ?>" alt="<?= app_h($item['name'] ?? '') ?>">
                  <?php endif; ?>
                  <div class="admin-item-main">
                    <h2><?= app_h($item['name'] ?? '') ?></h2>
                    <p>ID: <?= app_h($item['id'] ?? '') ?> · <?= app_h($item['category'] ?? '') ?></p>
                    <p>
                      <?= app_h($item['price'] ?? '') !== '' ? 'Цена: ' . app_h($item['price'] ?? '') . ' Br' : 'Цена не указана' ?>
                      ·
                      <?= app_h($types[$item['type'] ?? ''] ?? 'тип не указан') ?>
                    </p>
                  </div>
                  <div class="admin-item-actions">
                    <a class="btn btn-secondary" href="/admin/index.php?edit=<?= app_h($item['id'] ?? '') ?>">Редактировать</a>
                    <form method="post" onsubmit="return confirm('Удалить эту позицию?');">
                      <input type="hidden" name="action" value="delete">
                      <input type="hidden" name="id" value="<?= app_h($item['id'] ?? '') ?>">
                      <button class="btn btn-secondary" type="submit">Удалить</button>
                    </form>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>

        <div id="admin-form-modal" class="modal<?= $isFormOpen ? ' open' : '' ?>" aria-hidden="<?= $isFormOpen ? 'false' : 'true' ?>">
          <div class="modal-content admin-modal-content" tabindex="-1">
            <a class="modal-close" href="/admin/index.php" aria-label="Закрыть">×</a>
            <div class="content-block admin-modal-block">
              <h2><?= $editingItem ? 'Редактировать позицию' : 'Добавить позицию' ?></h2>
              <form method="post" enctype="multipart/form-data" class="admin-form-grid">
            <div class="admin-form-fields">
              <input type="hidden" name="action" value="save">
              <input type="hidden" name="id" value="<?= app_h($editingItem['id'] ?? '') ?>">
              <input type="hidden" name="current_image" value="<?= app_h($editingItem['image'] ?? '') ?>">

              <label>Название
                <input class="catalog-search-input" type="text" name="name" value="<?= app_h($editingItem['name'] ?? '') ?>" required>
              </label>

              <label>Цена
                <input class="catalog-search-input" type="text" name="price" value="<?= app_h($editingItem['price'] ?? '') ?>" placeholder="Например, 20">
              </label>

              <label>Категория
                <select class="catalog-search-input" name="category" required>
                  <option value="">Выберите категорию</option>
                  <?php foreach ($categories as $category): ?>
                    <option value="<?= app_h($category) ?>" <?= ($editingItem['category'] ?? '') === $category ? 'selected' : '' ?>>
                      <?= app_h($category) ?>
                    </option>
                  <?php endforeach; ?>
                </select>
              </label>

              <label>Формат
                <select class="catalog-search-input" name="type">
                  <option value="">Не указан</option>
                  <?php foreach ($types as $typeValue => $typeLabel): ?>
                    <option value="<?= app_h($typeValue) ?>" <?= ($editingItem['type'] ?? '') === $typeValue ? 'selected' : '' ?>>
                      <?= app_h($typeLabel) ?>
                    </option>
                  <?php endforeach; ?>
                </select>
              </label>

              <label>Размер
                <input class="catalog-search-input" type="text" name="size" value="<?= app_h($editingItem['size'] ?? '') ?>">
              </label>

              <label>Наличие
                <input class="catalog-search-input" type="text" name="available" value="<?= app_h($editingItem['available'] ?? '') ?>" placeholder="Например, в наличии">
              </label>

              <label>Описание
                <textarea class="catalog-search-input" name="description" rows="6"><?= app_h($editingItem['description'] ?? '') ?></textarea>
              </label>

              <div class="admin-actions">
                <button class="btn btn-primary" type="submit"><?= $editingItem ? 'Сохранить изменения' : 'Сохранить позицию' ?></button>
                <?php if ($editingItem): ?>
                  <a class="btn btn-secondary" href="/admin/index.php">Отмена</a>
                <?php endif; ?>
              </div>
            </div>

            <div>
              <div class="admin-dropzone" data-dropzone>
                <div class="admin-dropzone-title">Фото растения</div>
                <div class="admin-dropzone-text">Перетащите фото сюда или нажмите, чтобы выбрать файл.</div>
                <input type="file" name="image" accept="image/jpeg,image/png,image/webp">

                <div class="admin-preview">
                  <?php $previewImage = $editingItem['image'] ?? ''; ?>
                  <img
                    data-image-preview
                    src="<?= $previewImage !== '' ? app_h('/' . ltrim($previewImage, '/')) : '' ?>"
                    alt="Предпросмотр"
                    <?= $previewImage !== '' ? '' : 'hidden' ?>
                  >
                  <p data-image-preview-text>
                    <?= $previewImage !== '' ? app_h($previewImage) : 'Файл еще не выбран' ?>
                  </p>
                </div>
              </div>
            </div>
              </form>
            </div>
          </div>
        </div>

        <div class="content-block">
          <p><a class="btn btn-secondary" href="/admin/logout.php">Выйти</a></p>
        </div>
      </section>
    </div>
  </main>
</body>
</html>
