<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Peer Template API ===\n\n";

// Find a department to test
$department = \App\Models\Department::first();
if (!$department) {
    echo "❌ No departments found\n";
    exit(1);
}

echo "Dept: {$department->id} - {$department->name}\n";

// Build a minimal peer template payload
$payload = [
    'name' => 'Peer Template Test',
    'description' => 'Updated via test script',
    'form_info' => [
        'university' => 'BULE-HORA UNIVERSITY',
        'formTitle' => 'Peer-to-Peer Teacher Evaluation Criteria',
        'year' => date('Y'),
        'semester' => 'First',
    ],
    'questions' => [
        ['text' => 'Peer test Q1: collaborates effectively with colleagues.', 'type' => 'rating', 'section' => 'A'],
        ['text' => 'Peer test Q2: open to constructive feedback.', 'type' => 'rating', 'section' => 'B'],
        ['text' => 'Peer test Q3: maintains professionalism in class.', 'type' => 'rating', 'section' => 'C'],
    ]
];

$json = json_encode($payload);

echo "📤 PUT /api/departments/{$department->id}/peer-template\n";

// Use cURL to send the PUT request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/departments/{$department->id}/peer-template");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ cURL Error: {$error}\n";
    exit(1);
}

echo "📊 HTTP Status: {$httpCode}\n";
echo "📄 Response: {$response}\n\n";

// Query DB to verify rows were updated
$tpl = \App\Models\DepartmentPeerEvaluationTemplate::where('department_id', $department->id)
    ->where('is_active', true)
    ->first();

if (!$tpl) {
    echo "❌ No active peer template after update\n";
    exit(1);
}

// Count and list questions
$count = DB::table('peer_template_questions')->where('template_id', $tpl->id)->count();
echo "✅ peer_template_questions rows for template {$tpl->id}: {$count}\n";

$rows = DB::table('peer_template_questions')
    ->where('template_id', $tpl->id)
    ->orderBy('order')
    ->get();

foreach ($rows as $r) {
    echo "  [{$r->id}] sec={$r->section} ord={$r->order} text=" . substr($r->text, 0, 80) . "\n";
}

echo "\n=== Done ===\n";