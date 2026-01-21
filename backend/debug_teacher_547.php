<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Debugging Teacher ID 547 ===\n\n";

try {
    $teacher = App\Models\Teacher::find(547);
    
    if ($teacher) {
        echo "✅ Teacher found: {$teacher->name}\n";
        echo "📧 Email: {$teacher->email}\n";
        echo "🏢 Department ID: {$teacher->department_id}\n";
        
        // Check if department exists
        try {
            $dept = $teacher->department;
            if ($dept) {
                echo "✅ Department: {$dept->name}\n";
            } else {
                echo "❌ ERROR: Department not found for department_id: {$teacher->department_id}\n";
            }
        } catch (Exception $e) {
            echo "❌ ERROR loading department: {$e->getMessage()}\n";
        }
        
        // Check courses relationship
        try {
            $courses = $teacher->courses;
            echo "📚 Courses count: {$courses->count()}\n";
            
            foreach ($courses as $course) {
                echo "  - {$course->title} (ID: {$course->id})\n";
            }
        } catch (Exception $e) {
            echo "❌ ERROR loading courses: {$e->getMessage()}\n";
        }
        
        // Test the full load that the controller does
        echo "\n🧪 Testing controller load...\n";
        try {
            $fullTeacher = App\Models\Teacher::with(['department', 'courses'])->find(547);
            echo "✅ Full load successful\n";
            echo "📊 Data structure:\n";
            echo "  - Teacher: {$fullTeacher->name}\n";
            echo "  - Department: " . ($fullTeacher->department ? $fullTeacher->department->name : 'NULL') . "\n";
            echo "  - Courses: {$fullTeacher->courses->count()}\n";
        } catch (Exception $e) {
            echo "❌ ERROR in full load: {$e->getMessage()}\n";
            echo "📍 File: {$e->getFile()}:{$e->getLine()}\n";
            echo "🔍 Stack trace:\n{$e->getTraceAsString()}\n";
        }
        
    } else {
        echo "❌ Teacher ID 547 not found\n";
        
        // Check what teachers do exist
        $teacherCount = App\Models\Teacher::count();
        echo "📊 Total teachers in database: {$teacherCount}\n";
        
        if ($teacherCount > 0) {
            $lastTeacher = App\Models\Teacher::orderBy('id', 'desc')->first();
            echo "🔢 Highest teacher ID: {$lastTeacher->id}\n";
            
            $firstTeacher = App\Models\Teacher::orderBy('id', 'asc')->first();
            echo "🔢 Lowest teacher ID: {$firstTeacher->id}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Critical Error: {$e->getMessage()}\n";
    echo "📍 File: {$e->getFile()}:{$e->getLine()}\n";
    echo "🔍 Stack trace:\n{$e->getTraceAsString()}\n";
}

echo "\n=== Debug Complete ===\n";