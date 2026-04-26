<?php

require __DIR__ . '/../backend/bootstrap.php';

auth_logout();
app_redirect('/admin/login.php');
