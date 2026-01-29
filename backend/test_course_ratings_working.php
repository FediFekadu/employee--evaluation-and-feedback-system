<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Course Ratings API with real data\n";
echo "=========================================\n\n";

try {
    // Use department ID 41 which has evaluations
    $department = \App\Models\Department::find(41);
    
    if (!$department) {
        echo "❌ Department 41 not found\n";
        exit(1);
    }
    
    echo "✅ Found department: {$department->name} (ID: {$department->id})\n";
    
    // Find teacher Mohaz Mohammed (from the evaluations we found)
    $teacher = \App\Models\Teacher::where('name', 'Mohaz Mohammed')->first();
    
    if (!$teacher) {
        echo "❌ Teacher 'Mohaz Mohammed' not found\n";
        exit(1);
    }
    
    echo "✅ Found teacher: {$teacher->name} (ID: {$teacher->id})\n";
    
    // Check evaluations for this teacher in this department
    $evaluations = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
        $query->where('department_id', $department->id);
    })->where('teacher_id', $teacher->id)->with(['course', 'feedbacks.responses'])->get();
    
    echo "✅ Found {$evaluations->count()} evaluations for this teacher\n";
    
    foreach ($evaluations as $eval) {
        $responseCount = \App\Models\Response::whereHas('feedback', function($query) use ($eval) {
            $query->where('evaluation_id', $eval->id);
        })->whereNotNull('rating')->count();
        
        echo "  - {$eval->course->title}: {$responseCount} responses with ratings\n";
    }
    
    echo "\nTesting API endpoint...\n";
    
    // Test the API endpoint
    $request = new \Illuminate\Http\Request();
    $request->merge([
        'academic_year' => '2026',
        'semester' => 'Semester I'
    ]);
    
    $controller = new \App\Http\Controllers\DepartmentController();
    $response = $controller->teacherCourseRatings($request, $department, $teacher->id);
    
    $responseData = json_decode($response->getContent(), true);
    
    echo "Status Code: {$response->getStatusCode()}\n";
    
    if ($response->getStatusCode() === 200 && isset($responseData['success']) && $responseData['success']) {
        echo "✅ API endpoint working successfully!\n\n";
        
        echo "Response Summary:\n";
        echo "- Teacher: {$responseData['data']['teacher']['name']}\n";
        echo "- Department: {$responseData['data']['department']['name']}\n";
        echo "- Total Courses: {$responseData['data']['total_courses']}\n";
        echo "- Academic Year Filter: {$responseData['data']['filters']['academic_year']}\n";
        echo "- Semester Filter: {$responseData['data']['filters']['semester']}\n\n";
        
        if (!empty($responseData['data']['courses'])) {
            echo "Course Details:\n";
            foreach ($responseData['data']['courses'] as $course) {
                echo "  📚 {$course['course_title']} ({$course['course_code']})\n";
                echo "     - Total Responses: {$course['total_responses']}\n";
                echo "     - Average Rating: {$course['average_rating']}/5\n";
                echo "     - Final Score: {$course['final_score']}%\n";
                
                if (!empty($course['rating_distribution'])) {
                    echo "     - Rating Distribution:\n";
                    foreach ($course['rating_distribution'] as $rating => $data) {
                        if (is_array($data)) {
                            echo "       ⭐ {$rating}: {$data['count']} ({$data['percentage']}%)\n";
                        } else {
                            echo "       ⭐ {$rating}: {$data}\n";
                        }
                    }
                }
                echo "\n";
            }
        } else {
            echo "ℹ️  No courses found for this teacher in the specified period\n";
        }
        
    } else {
        echo "❌ API endpoint failed!\n";
        echo "Response: " . $response->getContent() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";