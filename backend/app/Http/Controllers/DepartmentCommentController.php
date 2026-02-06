<?php

namespace App\Http\Controllers;

use App\Models\DepartmentComment;
use App\Models\Department;
use App\Models\Teacher;
use App\Models\Course;
use Illuminate\Http\Request;

class DepartmentCommentController extends Controller
{
    private function containsMaliciousContent(string $text): bool
    {
        $sqlPatterns = [
            '/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\s+/i',
            '/[\'";].*(--)/',
            '/\bOR\s+\d+\s*=\s*\d+/i',
            '/\bAND\s+\d+\s*=\s*\d+/i',
        ];
        $xssPatterns = [
            '/<script[^>]*>.*?<\/script>/i',
            '/<iframe[^>]*>.*?<\/iframe>/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
        ];
        foreach (array_merge($sqlPatterns, $xssPatterns) as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }
        return false;
    }

    public function store(Request $request, Department $department)
    {
        $data = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'target_type' => 'required|in:teacher,course,general',
            'target_id' => 'nullable|integer',
            'teacher_id' => 'nullable|exists:teachers,id',
            'course_id' => 'nullable|exists:courses,id',
            'academic_year' => 'nullable|string|max:20',
            'semester' => 'nullable|string|max:50',
            'year_level' => 'nullable|string|max:10',
            'text' => 'required|string|max:1000',
        ]);

        if ($this->containsMaliciousContent($data['text'])) {
            return response()->json([
                'message' => 'Invalid content',
                'error' => 'malicious_content',
            ], 422);
        }

        if ($data['target_type'] !== 'general' && empty($data['target_id'])) {
            return response()->json([
                'message' => 'Target is required',
                'error' => 'target_required',
            ], 422);
        }

        if ($data['target_type'] === 'teacher') {
            $teacherId = $data['teacher_id'] ?? $data['target_id'];
            $teacher = Teacher::find($teacherId);
            if (!$teacher || $teacher->department_id !== $department->id) {
                return response()->json([
                    'message' => 'Invalid teacher target',
                    'error' => 'invalid_target',
                ], 422);
            }
            if (!empty($data['course_id'])) {
                $course = Course::find($data['course_id']);
                if (!$course || $course->department_id !== $department->id) {
                    return response()->json([
                        'message' => 'Invalid course target',
                        'error' => 'invalid_target',
                    ], 422);
                }
            }
        }

        if ($data['target_type'] === 'course') {
            $courseId = $data['course_id'] ?? $data['target_id'];
            $course = Course::find($courseId);
            if (!$course || $course->department_id !== $department->id) {
                return response()->json([
                    'message' => 'Invalid course target',
                    'error' => 'invalid_target',
                ], 422);
            }
        }

        $comment = DepartmentComment::create([
            'department_id' => $department->id,
            'student_id' => $data['student_id'] ?? null,
            'anonymous' => true,
            'target_type' => $data['target_type'],
            'target_id' => $data['target_type'] === 'general' 
                ? null 
                : ($data['target_type'] === 'teacher' ? ($data['teacher_id'] ?? $data['target_id']) : ($data['course_id'] ?? $data['target_id'])),
            'teacher_id' => $data['target_type'] === 'teacher' ? ($data['teacher_id'] ?? $data['target_id']) : null,
            'course_id' => $data['course_id'] ?? ($data['target_type'] === 'course' ? ($data['course_id'] ?? $data['target_id']) : null),
            'academic_year' => $data['academic_year'] ?? null,
            'semester' => $data['semester'] ?? null,
            'year_level' => $data['year_level'] ?? null,
            'text' => $data['text'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'comment' => $comment,
        ], 201);
    }

    public function index(Request $request, Department $department)
    {
        $data = $request->validate([
            'target_type' => 'nullable|in:teacher,course,general',
            'teacher_id' => 'nullable|integer',
            'course_id' => 'nullable|integer',
            'academic_year' => 'nullable|string',
            'semester' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
        ]);

        $query = DepartmentComment::with(['student:id,name'])
            ->where('department_id', $department->id);

        if (!empty($data['target_type'])) {
            $query->where('target_type', $data['target_type']);
        }
        if (!empty($data['teacher_id'])) {
            $query->where('target_type', 'teacher')->where('target_id', (int) $data['teacher_id']);
        }
        if (!empty($data['course_id'])) {
            $query->where('target_type', 'course')->where('target_id', (int) $data['course_id']);
        }
        if (!empty($data['academic_year'])) {
            $query->where('academic_year', $data['academic_year']);
        }
        if (!empty($data['semester'])) {
            $query->where('semester', $data['semester']);
        }
        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $comments = $query->orderByDesc('created_at')->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'text' => $c->text,
                'anonymous' => true,
                'created_at' => $c->created_at,
                'student' => null,
                'target_type' => $c->target_type,
                'academic_year' => $c->academic_year,
                'semester' => $c->semester,
                'year_level' => $c->year_level,
                'course' => $c->course_id ? Course::select('id','title','code')->find($c->course_id) : ($c->target_type === 'course' ? Course::select('id','title','code')->find($c->target_id) : null),
                'teacher' => $c->teacher_id ? Teacher::select('id','name')->find($c->teacher_id) : ($c->target_type === 'teacher' ? Teacher::select('id','name')->find($c->target_id) : null),
                'department_reply' => $c->department_reply,
                'department_reply_at' => $c->department_reply_at,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $comments->count(),
            'comments' => $comments,
        ]);
    }

    /**
     * List comments for a specific student (anonymous to department; used by student portal).
     */
    public function my(Request $request, Department $department)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);
        $comments = DepartmentComment::where('department_id', $department->id)
            ->where('student_id', $data['student_id'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'text' => $c->text,
                    'target_type' => $c->target_type,
                    'academic_year' => $c->academic_year,
                    'semester' => $c->semester,
                    'year_level' => $c->year_level,
                    'course' => $c->course_id ? Course::select('id','title','code')->find($c->course_id) : null,
                    'teacher' => $c->teacher_id ? Teacher::select('id','name')->find($c->teacher_id) : null,
                    'department_reply' => $c->department_reply,
                    'department_reply_at' => $c->department_reply_at,
                    'created_at' => $c->created_at,
                ];
            });
        return response()->json(['success' => true, 'comments' => $comments]);
    }

    /**
     * Student edit their own comment text.
     */
    public function update(Request $request, Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'text' => 'required|string|max:1000',
        ]);
        if ((int)$comment->student_id !== (int)$data['student_id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($this->containsMaliciousContent($data['text'])) {
            return response()->json(['message' => 'Invalid content', 'error' => 'malicious_content'], 422);
        }
        $comment->update(['text' => $data['text']]);
        return response()->json(['success' => true, 'comment' => $comment]);
    }

    /**
     * Student delete their own comment.
     */
    public function destroy(Request $request, Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);
        if ((int)$comment->student_id !== (int)$data['student_id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $comment->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Department add a reply visible to the student.
     */
    public function reply(Request $request, Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $data = $request->validate([
            'reply' => 'required|string|max:1000',
        ]);
        if ($this->containsMaliciousContent($data['reply'])) {
            return response()->json(['message' => 'Invalid content', 'error' => 'malicious_content'], 422);
        }
        $comment->update([
            'department_reply' => $data['reply'],
            'department_reply_at' => now(),
        ]);
        if ($comment->student_id) {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->createNotification(
                'student',
                (int) $comment->student_id,
                'reply',
                'Department Reply',
                $data['reply'],
                [
                    'comment_id' => $comment->id,
                    'department_id' => $department->id,
                    'target_type' => $comment->target_type,
                    'teacher_id' => $comment->teacher_id,
                    'course_id' => $comment->course_id,
                ],
                'info'
            );
        }
        return response()->json(['success' => true, 'comment' => $comment]);
    }

    public function approve(Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $comment->update(['status' => 'approved']);
        return response()->json(['success' => true, 'comment' => $comment]);
    }

    public function reject(Request $request, Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $notes = $request->validate(['moderation_notes' => 'nullable|string|max:1000']);
        $comment->update(['status' => 'rejected', 'moderation_notes' => $notes['moderation_notes'] ?? null]);
        return response()->json(['success' => true, 'comment' => $comment]);
    }

    public function flag(Request $request, Department $department, DepartmentComment $comment)
    {
        if ($comment->department_id !== $department->id) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $data = $request->validate(['flag_reason' => 'nullable|string|max:255']);
        $comment->update(['flagged' => true, 'flag_reason' => $data['flag_reason'] ?? null]);
        return response()->json(['success' => true, 'comment' => $comment]);
    }
}
