<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Checking Peer Template Questions ===\n\n";

$conn = config('database.default');
$dbName = null;
try {
    $dbName = DB::connection()->getDatabaseName();
} catch (\Exception $e) {
    $dbName = 'Unknown (connection error: ' . $e->getMessage() . ')';
}

echo "DB connection: {$conn}\n";
echo "DB name: {$dbName}\n\n";

$hasTable = Schema::hasTable('peer_template_questions');
echo "Has table 'peer_template_questions': " . ($hasTable ? 'YES' : 'NO') . "\n\n";

if (!$hasTable) {
    echo "❌ Table 'peer_template_questions' not found on this connection.\n";
    echo "➡️ Verify backend/.env DB settings and ensure you're inspecting the same database.\n";
    exit(1);
}

// Count rows
$count = DB::table('peer_template_questions')->count();
echo "Total peer questions: {$count}\n\n";

// Show sample rows
$rows = DB::table('peer_template_questions')
    ->select('id', 'template_id', 'text', 'type', 'section', 'order')
    ->orderBy('template_id')
    ->orderBy('order')
    ->limit(10)
    ->get();

if ($rows->isEmpty()) {
    echo "No rows present in 'peer_template_questions'.\n\n";
} else {
    echo "Sample rows:\n";
    foreach ($rows as $r) {
        echo "  [{$r->id}] tpl={$r->template_id} sec={$r->section} ord={$r->order} type={$r->type} text=" . substr($r->text, 0, 80) . "\n";
    }
    echo "\n";
}

// Show active peer template and question count per department
echo "=== Active Peer Templates by Department ===\n\n";
$departments = \App\Models\Department::all();
foreach ($departments as $dept) {
    $tpl = \App\Models\DepartmentPeerEvaluationTemplate::where('department_id', $dept->id)
        ->where('is_active', true)
        ->with('questions')
        ->first();
    if ($tpl) {
        echo "Dept {$dept->id} ({$dept->name}): Template '{$tpl->name}' with " . $tpl->questions->count() . " questions\n";
    } else {
        echo "Dept {$dept->id} ({$dept->name}): No active peer template\n";
    }
}

echo "\n=== Done ===\n";