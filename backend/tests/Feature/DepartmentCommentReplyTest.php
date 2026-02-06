<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Department;
use App\Models\Student;
use App\Models\DepartmentComment;
use App\Models\Notification;

class DepartmentCommentReplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_department_can_reply_and_student_gets_notification()
    {
        $department = Department::factory()->create();
        $student = Student::factory()->create(['department_id' => $department->id]);

        $comment = DepartmentComment::create([
            'department_id' => $department->id,
            'student_id' => $student->id,
            'anonymous' => true,
            'text' => 'Issue with lab resources',
            'target_type' => 'general',
            'status' => 'pending',
        ]);

        $res = $this->postJson("/api/departments/{$department->id}/comments/{$comment->id}/reply", [
            'reply' => 'Thanks for the feedback. We are restocking.',
        ]);
        $res->assertStatus(200);
        $this->assertEquals('Thanks for the feedback. We are restocking.', $res->json('comment.department_reply'));

        $notif = Notification::where('recipient_type', 'student')
            ->where('recipient_id', $student->id)
            ->where('type', 'reply')
            ->first();
        $this->assertNotNull($notif);
    }
}
