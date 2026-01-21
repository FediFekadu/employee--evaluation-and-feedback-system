<?php

require_once __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

$client = new Client([
    'base_uri' => 'http://127.0.0.1:8000',
    'timeout' => 30,
]);

$departmentId = 101; // Use a valid department ID
$endpoint = "/api/departments/{$departmentId}/visual-analytics";

echo "Testing rate limiting on: {$endpoint}\n";
echo "Making 10 rapid requests...\n\n";

$headers = [
    'Accept' => 'application/json',
    'Content-Type' => 'application/json',
];

// Add auth token if available
$authToken = getenv('AUTH_TOKEN');
if ($authToken) {
    $headers['Authorization'] = "Bearer {$authToken}";
}

$successCount = 0;
$rateLimitedCount = 0;
$errorCount = 0;

for ($i = 1; $i <= 10; $i++) {
    try {
        $start = microtime(true);
        
        $response = $client->get($endpoint, [
            'headers' => $headers,
            'query' => [
                'chart_types' => ['performance_distribution', 'participation_trends'],
                'time_range' => '1year'
            ]
        ]);
        
        $duration = round((microtime(true) - $start) * 1000, 2);
        $statusCode = $response->getStatusCode();
        
        if ($statusCode === 200) {
            $successCount++;
            echo "Request {$i}: SUCCESS (200) - {$duration}ms\n";
        } else {
            echo "Request {$i}: Unexpected status {$statusCode} - {$duration}ms\n";
        }
        
    } catch (RequestException $e) {
        $duration = round((microtime(true) - $start) * 1000, 2);
        $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 'No response';
        
        if ($statusCode === 429) {
            $rateLimitedCount++;
            $retryAfter = $e->getResponse()->getHeader('Retry-After')[0] ?? 'Not specified';
            echo "Request {$i}: RATE LIMITED (429) - {$duration}ms - Retry-After: {$retryAfter}\n";
        } else {
            $errorCount++;
            echo "Request {$i}: ERROR ({$statusCode}) - {$duration}ms - {$e->getMessage()}\n";
        }
    }
    
    // Small delay to see the rate limiting in action
    usleep(100000); // 100ms delay
}

echo "\n=== SUMMARY ===\n";
echo "Successful requests: {$successCount}\n";
echo "Rate limited requests: {$rateLimitedCount}\n";
echo "Other errors: {$errorCount}\n";

if ($rateLimitedCount > 0) {
    echo "\n✅ Rate limiting is working correctly!\n";
} else {
    echo "\n⚠️  Rate limiting may not be working as expected.\n";
}