<?php

require __DIR__ . '/../backend/bootstrap.php';

auth_require_login();

$catalog = catalog_repository_read($config);
$items = $catalog['items'];
$types = [
    'pot' => 'в горшке',
    'ground' => 'в грунте',
    'cut' => 'под срезку',
];

function admin_print_image_src(array $item): string
{
    $image = trim((string) ($item['image'] ?? ''));

    if ($image === '') {
        return app_url('/images/logo.png');
    }

    return app_url('/' . ltrim($image, '/'));
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF каталог растений</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #edf1ec;
      color: #1f2937;
      font-family: Arial, sans-serif;
    }

    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 12px 20px;
      background: #ffffff;
      border-bottom: 1px solid #dfe7dd;
    }

    .print-toolbar h1 {
      margin: 0;
      font-size: 18px;
    }

    .print-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      min-height: 36px;
      border: 1px solid #2f7d32;
      border-radius: 8px;
      padding: 8px 12px;
      background: #2f7d32;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-secondary {
      background: #ffffff;
      color: #2f7d32;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 12mm auto;
      padding: 10mm;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(31, 41, 55, 0.14);
      page-break-after: always;
    }

    .sheet:last-child {
      page-break-after: auto;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 8mm;
      min-height: 277mm;
    }

    .plant-card {
      display: grid;
      grid-template-rows: 63mm auto;
      min-height: 132mm;
      border: 1px solid #dfe7dd;
      border-radius: 6px;
      overflow: hidden;
      break-inside: avoid;
    }

    .plant-card img {
      width: 100%;
      height: 63mm;
      object-fit: cover;
      display: block;
      background: #f3f4f6;
    }

    .plant-body {
      display: flex;
      flex-direction: column;
      gap: 3mm;
      padding: 5mm;
    }

    .plant-title {
      margin: 0;
      font-size: 15pt;
      line-height: 1.15;
    }

    .plant-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      font-size: 8.5pt;
      color: #4b5563;
    }

    .plant-pill {
      border-radius: 999px;
      padding: 1.5mm 2.5mm;
      background: #eef7ed;
      color: #1c5f26;
      font-weight: 700;
    }

    .plant-price {
      font-size: 13pt;
      font-weight: 700;
      color: #1c5f26;
    }

    .plant-description {
      font-size: 9.5pt;
      line-height: 1.35;
      color: #374151;
    }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .print-toolbar {
        display: none;
      }

      .sheet {
        width: 210mm;
        height: 297mm;
        min-height: 0;
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <header class="print-toolbar">
    <h1>Каталог растений</h1>
    <div class="print-actions">
      <button class="btn" type="button" onclick="window.print()">Сохранить PDF</button>
      <a class="btn btn-secondary" href="<?= app_h(app_url('/admin/index.php')) ?>">Назад</a>
    </div>
  </header>

  <?php foreach (array_chunk($items, 4) as $chunk): ?>
    <section class="sheet">
      <div class="catalog-grid">
        <?php foreach ($chunk as $item): ?>
          <?php
            $available = catalog_repository_normalize_available($item['available'] ?? true);
            $typeLabel = $types[$item['type'] ?? ''] ?? '';
          ?>
          <article class="plant-card">
            <img src="<?= app_h(admin_print_image_src($item)) ?>" alt="<?= app_h($item['name'] ?? '') ?>">
            <div class="plant-body">
              <h2 class="plant-title"><?= app_h($item['name'] ?? '') ?></h2>
              <div class="plant-meta">
                <span class="plant-pill"><?= app_h($item['category'] ?? '') ?></span>
                <?php if ($typeLabel !== ''): ?>
                  <span class="plant-pill"><?= app_h($typeLabel) ?></span>
                <?php endif; ?>
                <span class="plant-pill"><?= $available ? 'В наличии' : 'Нет в наличии' ?></span>
              </div>
              <div class="plant-price">
                <?= trim((string) ($item['price'] ?? '')) !== '' ? 'Цена от ' . app_h($item['price']) . ' Br' : 'Цена по запросу' ?>
              </div>
              <?php if (trim((string) ($item['description'] ?? '')) !== ''): ?>
                <div class="plant-description"><?= app_h($item['description'] ?? '') ?></div>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>
  <?php endforeach; ?>
</body>
</html>
