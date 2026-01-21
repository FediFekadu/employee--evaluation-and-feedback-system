<?php

echo "=== Testing API Endpoint Directly ===\n\n";

// Test data that mimics what the frontend sends
$testData = [
    'evaluation_id' => 3509, // Fresh evaluation
    'student_id' => 38274,   // Fresh student
    'anonymous' => true,
    'responses' => [
        [
            'question_id' => 7977,
            'rating' => 4,
            'text' => null
        ],
        [
            'question_id' => 7978,
            'rating' => 5,
            'text' => null
        ],
        [
            'question_id' => 7979,
            'rating' => 3,
            'text' => null
        ]
    ]
];

// Convert to JSON
$jsonData = json_encode($testData);

echo "📤 Sending POST request to /api/feedbacks\n";
echo "📊 Data: " . $jsonData . "\n\n";

// Use cURL to test the API endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/feedbacks');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
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
    echo "❌ cURL Error: $error\n";
    exit(1);
}

echo "📊 HTTP Status Code: $httpCode\n";
echo "📄 Response:\n";
echo $response . "\n\n";

// Parse response
$responseData = json_decode($response, true);

if ($httpCode === 201) {
    echo "✅ Submission successful!\n";
    if (isset($responseData['message'])) {
        echo "💬 Message: " . $responseData['message'] . "\n";
    }
} elseif ($httpCode === 422) {
    echo "❌ Validation Error (422)\n";
    if (isset($responseData['message'])) {
        echo "💬 Message: " . $responseData['message'] . "\n";
    }
    if (isset($responseData['errors'])) {
        echo "🔍 Validation Errors:\n";
        foreach ($responseData['errors'] as $field => $messages) {
            echo "  - $field: " . implode(', ', $messages) . "\n";
        }
    }
} else {
    echo "❌ Unexpected response\n";
    if (isset($responseData['message'])) {
        echo "💬 Message: " . $responseData['message'] . "\n";
    }
}

echo "\n=== Test Complete ===\n";