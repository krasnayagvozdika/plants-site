<?php

function config_writer_save(array $config): void
{
    $target = __DIR__ . '/config.local.php';

    $export = var_export($config, true);
    $content = "<?php\n\nreturn {$export};\n";

    file_put_contents($target, $content, LOCK_EX);
}
