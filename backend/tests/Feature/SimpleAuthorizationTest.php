<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Department;
use App\Models\Course;
use App\Models\User;
use App\Services\ChannelAuthorizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SimpleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test basic authorization functionality
     */
    public function test_basic_authorization()
    {
        $department = Department::factory()->create();
        $student = Student::factory()->create(['department_id' => $department->id]);
        $user = User::factory()->create([
            'role' => 'student',
            'department_id' => $department->id,
            'student_id' => $student->id
        ]);
        
        $authService = app(ChannelAuthorizationService::class);
        
        $this->assertTrue(
            $authService->authorizeEvaluationChannel($user, $department->id),
            'Student should have access to their department evaluation channel'
        );
    }
}