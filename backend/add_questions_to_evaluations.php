<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// Deprecated: backend now relies exclusively on department-defined questions.
echo "Deprecated: This script has been disabled. Evaluations should use questions saved from the Department UI.\n";
exit(0);

// Get all evaluations that don't have questions
// The rest of the script is intentionally disabled.