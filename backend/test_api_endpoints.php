<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing API Endpoints ===\n\n";

// Test analytics endpoint
echo "🔍 Testing Analytics Endpoint...\n";
try {
    $department = \App\Models\Department::first();
    if ($department) {
        $controller = new \App\Http\Controllers\DepartmentController();
        $request = new \Illuminate\Http\Request(['cache' => true]);
        
        $response = $controller->analytics($request, $department);
        $data = json_decode($response->getContent(), true);
        
        if ($response->getStatusCode() === 200) {
            echo "✅ Analytics endpoint working\n";
            echo "📊 Total evaluations: " . ($data['data']['summary']['total_evaluations'] ?? 'N/A') . "\n";
            echo "🟢 Active evaluations: " . ($data['data']['summary']['active_evaluations'] ?? 'N/A') . "\n";
            echo "🔴 Closed evaluations: " . ($data['data']['summary']['closed_evaluations'] ?? 'N/A') . "\n";
        } else {
            echo "❌ Analytics endpoint failed with status: " . $response->getStatusCode() . "\n";
            echo "Error: " . ($data['message'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "❌ No departments found\n";
    }
} catch (\Exception $e) {
    echo "❌ Analytics test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test logout endpoint
echo "🔍 Testing Logout Endpoint...\n";
try {
    $controller = new \App\Http\Controllers\AuthController();
    $request = new \Illuminate\Http\Request();
    
    $response = $controller->logout($request);
    $data = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Logout endpoint working\n";
        echo "📝 Message: " . ($data['message'] ?? 'N/A') . "\n";
    } else {
        echo "❌ Logout endpoint failed with status: " . $response->getStatusCode() . "\n";
    }
} catch (\Exception $e) {
    echo "❌ Logout test failed: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
echo "🎉 API endpoints should now work correctly!\n";