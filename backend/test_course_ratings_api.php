<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Department;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Feedback;
use App\Models\Response;
use App\Models\Question;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Course Ratings API Endpoint\n";
echo "===================================\n\n";

try {
    // Find a department with evaluations
    $department = Department::with(['evaluations.teacher', 'evaluations.course'])->first();
    
    if (!$department) {
        echo "❌ No departments found\n";
        exit(1);
    }
    
    echo "✅ Found department: {$department->name} (ID: {$department->id})\n";
    
    // Find a teacher with evaluations in this department
    $evaluation = $department->evaluations()->with(['teacher', 'course', 'feedbacks.responses'])->first();
    
    if (!$evaluation || !$evaluation->teacher) {
        echo "❌ No evaluations with teachers found in this department\n";
        exit(1);
    }
    
    $teacher = $evaluation->teacher;
    echo "✅ Found teacher: {$teacher->name} (ID: {$teacher->id})\n";
    echo "✅ Found evaluation: {$evaluation->course->title} (ID: {$evaluation->id})\n";
    
    // Check if there are responses for this evaluation
    $responseCount = \App\Models\Response::whereHas('feedback', function($query) use ($evaluation) {
        $query->where('evaluation_id', $evaluation->id);
    })->whereNotNull('rating')->count();
    
    echo "✅ Found {$responseCount} responses with ratings\n\n";
    
    // Test the API endpoint
    echo "Testing API endpoint...\n";
    
    $request = new \Illuminate\Http\Request();
    $request->merge([
        'academic_year' => $evaluation->academic_year,
        'semester' => $evaluation->semester
    ]);
    
    $controller = new \App\Http\Controllers\DepartmentController();
    $response = $controller->teacherCourseRatings($request, $department, $teacher->id);
    
    $responseData = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200 && $responseData['success']) {
        echo "✅ API endpoint working successfully!\n\n";
        
        echo "Response Summary:\n";
        echo "- Teacher: {$responseData['data']['teacher']['name']}\n";
        echo "- Department: {$responseData['data']['department']['name']}\n";
        echo "- Total Courses: {$responseData['data']['total_courses']}\n";
        echo "- Academic Year: {$responseData['data']['filters']['academic_year']}\n";
        echo "- Semester: {$responseData['data']['filters']['semester']}\n\n";
        
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
                        echo "       ⭐ {$rating}: {$data['count']} ({$data['percentage']}%)\n";
                    }
                }
                echo "\n";
            }
        } else {
            echo "ℹ️  No courses found for this teacher in the specified period\n";
        }
        
    } else {
        echo "❌ API endpoint failed!\n";
        echo "Status Code: {$response->getStatusCode()}\n";
        echo "Response: " . $response->getContent() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";