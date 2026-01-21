<?php

require_once 'vendor/autoload.php';

use Tests\TestCase;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Department;
use App\Models\Evaluation;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DebugTest extends TestCase
{
    use RefreshDatabase;

    public function test_debug_export_endpoint()
    {
        // Set up test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);

        // Test missing format parameter
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/export", []);
        echo "Status code for missing format: " . $response->status() . "\n";
        echo "Response body: " . $response->getContent() . "\n";
    }
}

$test = new DebugTest();
$test->setUp();
$test->test_debug_export_endpoint();