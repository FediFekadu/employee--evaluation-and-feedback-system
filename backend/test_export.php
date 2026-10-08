<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\ReportGenerationService;
use App\Models\Department;
use App\Models\Evaluation;

try {
    echo "Starting export test...\n";
    
    // Create a mock department or find one
    $department = Department::first();
    if (!$department) {
        echo "No department found. Creating a dummy one.\n";
        $department = new Department();
        $department->id = 999;
        $department->name = 'Test Dept';
        // You might need to save it if there are foreign keys, but let's try without first if possible
        // or just mock the data array
    } else {
        echo "Using department: {$department->name} (ID: {$department->id})\n";
    }

    $service = app(ReportGenerationService::class);
    
    // Mock report data structure required by exportDepartmentToPDF
    $reportData = [
        'report_type' => 'department_summary',
        'department' => $department,
        'evaluations' => collect([]), // Empty collection for now
        'summary' => [
            'total_evaluations' => 0,
            'active_evaluations' => 0,
            'closed_evaluations' => 0,
            'total_responses' => 0,
            'average_participation' => 0,
        ],
        'export_timestamp' => now(),
        'filters_applied' => [],
        'sort_applied' => [
            'field' => 'date',
            'direction' => 'desc'
        ],
        'privacy_preserved' => false
    ];

    echo "Calling exportDepartmentToPDF...\n";
    $path = $service->exportDepartmentToPDF($reportData);
    
    echo "Export successful! File path: $path\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} catch (\Throwable $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
