<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Department;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Notification;

class NotificationFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_for_evaluation_open_and_close_and_student_api()
    {
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course->teachers()->attach($teacher->id);

        $studentA = Student::factory()->create(['department_id' => $department->id]);
        $studentB = Student::factory()->create(['department_id' => $department->id]);

        $storeRes = $this->postJson('/api/evaluations', [
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'academic_year' => '2025/26',
            'semester' => 'Semester I',
            'year_level' => 1,
            'opened_at' => now()->toISOString(),
        ]);
        $this->assertContains($storeRes->status(), [200, 201]);
        $evaluationId = $storeRes->json('id');
        $this->assertNotEmpty($evaluationId);

        $openedStudentCount = Notification::where('type', 'opened')
            ->where('recipient_type', 'student')
            ->count();
        $this->assertEquals(2, $openedStudentCount);

        $openedTeacherCount = Notification::where('type', 'opened')
            ->where('recipient_type', 'teacher')
            ->count();
        $this->assertEquals(1, $openedTeacherCount);

        $openedDepartmentCount = Notification::where('type', 'opened')
            ->where('recipient_type', 'department')
            ->count();
        $this->assertEquals(1, $openedDepartmentCount);

        $closeRes = $this->postJson("/api/evaluations/{$evaluationId}/close");
        $closeRes->assertStatus(200);

        $closedStudentCount = Notification::where('type', 'closed')
            ->where('recipient_type', 'student')
            ->count();
        $this->assertEquals(2, $closedStudentCount);

        $closedTeacherCount = Notification::where('type', 'closed')
            ->where('recipient_type', 'teacher')
            ->count();
        $this->assertEquals(1, $closedTeacherCount);

        $closedDepartmentCount = Notification::where('type', 'closed')
            ->where('recipient_type', 'department')
            ->count();
        $this->assertEquals(1, $closedDepartmentCount);

        $listRes = $this->getJson('/api/notifications?recipient_type=student&recipient_id='.$studentA->id.'&status=unread&limit=5');
        $listRes->assertStatus(200);
        $items = $listRes->json('notifications');
        $this->assertIsArray($items);
        $this->assertNotEmpty($items);

        $first = $items[0];
        $notifId = $first['id'];

        $markRes = $this->postJson("/api/notifications/{$notifId}/read", [
            'recipient_type' => 'student',
            'recipient_id' => $studentA->id,
        ]);
        $markRes->assertStatus(200);
        $this->assertNotNull(Notification::find($notifId)->read_at);
    }
}
