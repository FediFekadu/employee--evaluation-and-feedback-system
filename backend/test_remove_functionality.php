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

echo "=== Testing Remove Instructor Functionality ===\n\n";

try {
    // Find a department with courses and teachers
    $department = Department::with(['courses.teachers', 'teachers'])->first();
    
    if (!$department) {
        echo "❌ No department found\n";
        exit(1);
    }
    
    echo "📚 Testing with Department: {$department->name}\n";
    
    // Find a course with at least one assigned teacher
    $courseWithTeacher = $department->courses->first(function($course) {
        return $course->teachers->count() > 0;
    });
    
    if (!$courseWithTeacher) {
        echo "❌ No course with assigned teachers found\n";
        exit(1);
    }
    
    echo "📖 Course: {$courseWithTeacher->title} ({$courseWithTeacher->code})\n";
    
    // Get current teacher assignment
    $teacherToRemove = $courseWithTeacher->teachers->first();
    $semester = $teacherToRemove->pivot->semester;
    $yearLevel = $teacherToRemove->pivot->year_level;
    
    echo "👨‍🏫 Teacher to Remove: {$teacherToRemove->name}\n";
    echo "📅 Semester: {$semester}\n";
    echo "📊 Year Level: {$yearLevel}\n\n";
    
    // Count teachers before removal
    $teachersBeforeCount = $courseWithTeacher->teachers->count();
    echo "📊 Teachers before removal: {$teachersBeforeCount}\n";
    
    // Test the remove functionality
    $controller = new CourseController();
    
    // Create a mock request
    $request = Request::create('/api/courses/' . $courseWithTeacher->id . '/remove-teacher', 'POST', [
        'teacher_id' => $teacherToRemove->id,
        'semester' => $semester,
    ]);
    
    echo "🧪 Testing removal...\n";
    $response = $controller->removeTeacher($request, $courseWithTeacher->id);
    $responseData = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Removal successful!\n";
        echo "📝 Message: {$responseData['message']}\n\n";
        
        // Verify the removal
        $updatedCourse = Course::with(['teachers' => function($query) {
            $query->withPivot('year_level', 'semester');
        }])->find($courseWithTeacher->id);
        
        $teachersAfterCount = $updatedCourse->teachers->count();
        echo "📊 Teachers after removal: {$teachersAfterCount}\n";
        
        $removedTeacherStillAssigned = $updatedCourse->teachers->first(function($teacher) use ($teacherToRemove, $semester) {
            return $teacher->id === $teacherToRemove->id && 
                   $teacher->pivot->semester === $semester;
        });
        
        if (!$removedTeacherStillAssigned && $teachersAfterCount === ($teachersBeforeCount - 1)) {
            echo "✅ Verification successful!\n";
            echo "👨‍🏫 Teacher successfully removed: {$teacherToRemove->name}\n";
        } else {
            echo "❌ Verification failed - teacher not properly removed\n";
        }
        
    } else {
        echo "❌ Removal failed!\n";
        echo "📝 Status: {$response->getStatusCode()}\n";
        echo "📝 Response: " . $response->getContent() . "\n";
    }
    
    echo "\n=== Test Cases ===\n";
    
    // Test case 1: Remove non-existent teacher (should fail)
    echo "\n🧪 Test 1: Remove non-existent teacher (should fail)\n";
    $request1 = Request::create('/api/courses/' . $courseWithTeacher->id . '/remove-teacher', 'POST', [
        'teacher_id' => 99999,
        'semester' => $semester,
    ]);
    
    $response1 = $controller->removeTeacher($request1, $courseWithTeacher->id);
    if ($response1->getStatusCode() === 422) {
        echo "✅ Correctly rejected non-existent teacher\n";
    } else {
        echo "❌ Should have rejected non-existent teacher\n";
    }
    
    // Test case 2: Remove teacher not assigned to course (should fail)
    echo "\n🧪 Test 2: Remove teacher not assigned to course (should fail)\n";
    $unassignedTeacher = $department->teachers->first(function($teacher) use ($updatedCourse, $semester) {
        return !$updatedCourse->teachers->contains(function($assignedTeacher) use ($teacher, $semester) {
            return $assignedTeacher->id === $teacher->id && 
                   $assignedTeacher->pivot->semester === $semester;
        });
    });
    
    if ($unassignedTeacher) {
        $request2 = Request::create('/api/courses/' . $courseWithTeacher->id . '/remove-teacher', 'POST', [
            'teacher_id' => $unassignedTeacher->id,
            'semester' => $semester,
        ]);
        
        $response2 = $controller->removeTeacher($request2, $courseWithTeacher->id);
        if ($response2->getStatusCode() === 400) {
            echo "✅ Correctly rejected unassigned teacher\n";
        } else {
            echo "❌ Should have rejected unassigned teacher\n";
        }
    } else {
        echo "⚠️ No unassigned teacher found for testing\n";
    }
    
    echo "\n✅ All tests completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "📍 File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}