<?php

require __DIR__ . '/../backend/bootstrap.php';

$error = '';

if (auth_is_logged_in()) {
    app_redirect('/admin/index.php');
}

if (app_is_post()) {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if (auth_attempt_login($config, $username, $password)) {
        app_redirect('/admin/index.php');
    }

    $error = 'Неверный логин или пароль.';
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход в админку</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="page">
    <div class="container page-wrap">
      <section class="page-card">
        <div class="page-intro">
          <span class="page-kicker">Администрирование</span>
          <h1 class="page-title">Вход</h1>
        </div>

        <?php if ($error !== ''): ?>
          <div class="empty empty-search">
            <p><?= app_h($error) ?></p>
          </div>
        <?php endif; ?>

        <form class="content-block" method="post">
          <p><label>Логин<br><input class="catalog-search-input" type="text" name="username" required></label></p>
          <p><label>Пароль<br><input class="catalog-search-input" type="password" name="password" required></label></p>
          <p><button class="btn btn-primary" type="submit">Войти</button></p>
        </form>
      </section>
    </div>
  </main>
</body>
</html>
