<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\CourseController;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\Department;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Remove Instructor Functionality (with setup) ===\n\n";

try {
    // Find a department with courses and teachers
    $department = Department::with(['courses', 'teachers'])->first();
    
    if (!$department) {
        echo "❌ No department found\n";
        exit(1);
    }
    
    echo "📚 Testing with Department: {$department->name}\n";
    
    $course = $department->courses->first();
    $teacher = $department->teachers->first();
    
    if (!$course || !$teacher) {
        echo "❌ No course or teacher found\n";
        exit(1);
    }
    
    echo "📖 Course: {$course->title} ({$course->code})\n";
    echo "👨‍🏫 Teacher: {$teacher->name}\n\n";
    
    $controller = new CourseController();
    
    // First, assign the teacher to the course
    echo "🔗 Step 1: Assigning teacher to course...\n";
    $assignRequest = Request::create('/api/courses/' . $course->id . '/assign-teacher', 'POST', [
        'teacher_id' => $teacher->id,
        'year_level' => 1,
        'semester' => 'Semester I',
    ]);
    
    $assignResponse = $controller->assignTeacher($assignRequest, $course->id);
    
    if ($assignResponse->getStatusCode() === 200) {
        echo "✅ Teacher assigned successfully\n\n";
        
        // Now test the remove functionality
        echo "🗑️ Step 2: Removing teacher from course...\n";
        $removeRequest = Request::create('/api/courses/' . $course->id . '/remove-teacher', 'POST', [
            'teacher_id' => $teacher->id,
            'semester' => 'Semester I',
        ]);
        
        $removeResponse = $controller->removeTeacher($removeRequest, $course->id);
        $removeResponseData = json_decode($removeResponse->getContent(), true);
        
        if ($removeResponse->getStatusCode() === 200) {
            echo "✅ Removal successful!\n";
            echo "📝 Message: {$removeResponseData['message']}\n\n";
            
            // Verify the removal
            $updatedCourse = Course::with(['teachers' => function($query) {
                $query->withPivot('year_level', 'semester');
            }])->find($course->id);
            
            $teacherStillAssigned = $updatedCourse->teachers->first(function($t) use ($teacher) {
                return $t->id === $teacher->id && $t->pivot->semester === 'Semester I';
            });
            
            if (!$teacherStillAssigned) {
                echo "✅ Verification successful! Teacher removed from course.\n";
            } else {
                echo "❌ Verification failed - teacher still assigned\n";
            }
            
        } else {
            echo "❌ Removal failed!\n";
            echo "📝 Status: {$removeResponse->getStatusCode()}\n";
            echo "📝 Response: " . $removeResponse->getContent() . "\n";
        }
        
    } else {
        echo "❌ Assignment failed, cannot test removal\n";
        echo "📝 Status: {$assignResponse->getStatusCode()}\n";
        echo "📝 Response: " . $assignResponse->getContent() . "\n";
    }
    
    echo "\n=== Additional Test Cases ===\n";
    
    // Test case 1: Try to remove teacher that's not assigned
    echo "\n🧪 Test 1: Remove teacher not assigned to course (should fail)\n";
    $request1 = Request::create('/api/courses/' . $course->id . '/remove-teacher', 'POST', [
        'teacher_id' => $teacher->id,
        'semester' => 'Semester I',
    ]);
    
    $response1 = $controller->removeTeacher($request1, $course->id);
    if ($response1->getStatusCode() === 400) {
        echo "✅ Correctly rejected unassigned teacher\n";
    } else {
        echo "❌ Should have rejected unassigned teacher\n";
        echo "📝 Status: {$response1->getStatusCode()}\n";
    }
    
    // Test case 2: Invalid teacher ID
    echo "\n🧪 Test 2: Invalid teacher ID (should fail)\n";
    $request2 = Request::create('/api/courses/' . $course->id . '/remove-teacher', 'POST', [
        'teacher_id' => 99999,
        'semester' => 'Semester I',
    ]);
    
    $response2 = $controller->removeTeacher($request2, $course->id);
    if ($response2->getStatusCode() === 422) {
        echo "✅ Correctly rejected invalid teacher ID\n";
    } else {
        echo "❌ Should have rejected invalid teacher ID\n";
        echo "📝 Status: {$response2->getStatusCode()}\n";
    }
    
    echo "\n✅ All tests completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "📍 File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}