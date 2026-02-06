<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Teacher;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class CourseController extends Controller
{
    public function index()
    {
        return Course::with('department', 'teachers')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'title' => 'required|string',
            'code' => 'required|string|unique:courses,code',
            'description' => 'nullable|string',
            'year_level' => 'nullable|string',
            'semester' => 'nullable|string',
            'teacher_ids' => 'array',
            'teacher_ids.*' => 'exists:teachers,id',
        ]);
        $course = Course::create($data);
        if (!empty($data['teacher_ids'])) {
            $course->teachers()->sync($data['teacher_ids']);
        }
        return response()->json($course, 201);
    }

    public function show(Course $course)
    {
        return $course->load('department', 'teachers', 'evaluations');
    }

    public function update(Request $request, Course $course)
    {
        $data = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'title' => 'required|string',
            'code' => 'required|string|unique:courses,code,' . $course->id,
            'description' => 'nullable|string',
            'year_level' => 'nullable|string',
            'semester' => 'nullable|string',
            'teacher_ids' => 'array',
            'teacher_ids.*' => 'exists:teachers,id',
        ]);
        
        $course->update($data);
        
        if (isset($data['teacher_ids'])) {
            $course->teachers()->sync($data['teacher_ids']);
        }
        
        return response()->json($course->load('department', 'teachers'));
    }

    /**
     * Assign a teacher to a course.
     */
    public function assignTeacher(Request $request, $id)
    {
        $data = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            // Provided by UI but not stored on current pivot schema
            'year_level' => 'nullable|integer|min:1|max:6',
            'semester' => 'nullable|string',
        ]);

        $course = Course::findOrFail($id);
        $teacher = Teacher::findOrFail($data['teacher_id']);

        // Ensure teacher belongs to the same department as the course
        if ($teacher->department_id !== $course->department_id) {
            return response()->json([
                'message' => 'Instructor must belong to the same department as the course',
                'error' => 'department_mismatch',
            ], 422);
        }

        // Check if another teacher is already assigned to this course for the same semester
        $semester = $data['semester'] ?? null;
        if ($semester) {
            $existingAssignment = $course->teachers()
                ->wherePivot('semester', $semester)
                ->where('teacher_id', '!=', $teacher->id)
                ->exists();

            if ($existingAssignment) {
                return response()->json([
                    'message' => 'Another instructor is already assigned to this course for ' . $semester,
                    'error' => 'duplicate_assignment',
                ], 422);
            }
        }

        // Check if this specific teacher is already assigned to this course for the same semester
        $teacherAlreadyAssigned = $course->teachers()
            ->where('teacher_id', $teacher->id)
            ->wherePivot('semester', $semester)
            ->exists();

        if ($teacherAlreadyAssigned) {
            return response()->json([
                'message' => 'This instructor is already assigned to this course for ' . ($semester ?: 'the selected semester'),
                'error' => 'teacher_already_assigned',
            ], 422);
        }

        // Attach the teacher with pivot data
        $pivotData = [];
        if (isset($data['year_level'])) {
            $pivotData['year_level'] = $data['year_level'];
        }
        if (isset($data['semester'])) {
            $pivotData['semester'] = $data['semester'];
        }

        $course->teachers()->attach($teacher->id, $pivotData);

        // Reload relations to return updated course info
        $course->load('department', 'teachers');

        $response = [
            'message' => 'Instructor assigned successfully',
            'course' => $course,
        ];
        return response()->json($response);
    }

    /**
     * Remove a teacher from a course.
     */
    public function removeTeacher(Request $request, $id)
    {
        try {
            $request->validate([
                'teacher_id' => 'required|integer|exists:teachers,id',
                'semester' => 'required|string|in:Semester I,Semester II',
            ]);

            $course = Course::findOrFail($id);
            $teacherId = $request->teacher_id;
            $semester = $request->semester;

            // Verify teacher is actually assigned to this course for the specified semester
            $assignment = $course->teachers()
                ->where('teacher_id', $teacherId)
                ->where('semester', $semester)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'error' => 'teacher_not_assigned',
                    'message' => 'The selected instructor is not assigned to this course for the specified semester.'
                ], 400);
            }

            // Remove the assignment
            $course->teachers()->detach($teacherId);

            // Load the updated course with teachers
            $course->load(['teachers' => function($query) {
                $query->withPivot('year_level', 'semester');
            }]);

            $response = [
                'message' => 'Instructor removed successfully',
                'course' => $course
            ];
            return response()->json($response);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'validation_failed',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error removing teacher from course: ' . $e->getMessage());
            return response()->json([
                'error' => 'server_error',
                'message' => 'An error occurred while removing the instructor'
            ], 500);
        }
    }

    /**
     * List student comments for a course, optionally filtered by teacher, academic_year, semester.
     */
    public function comments(Request $request, Course $course)
    {
        $teacherId = $request->query('teacher_id');
        $academicYear = $request->query('academic_year');
        $semester = $request->query('semester');

        $query = Feedback::with(['student:id,name', 'evaluation:id,course_id,teacher_id,academic_year,semester'])
            ->whereHas('evaluation', function ($q) use ($course, $teacherId, $academicYear, $semester) {
                $q->where('course_id', $course->id);
                if ($teacherId) {
                    $q->where('teacher_id', $teacherId);
                }
                if ($academicYear) {
                    $q->where('academic_year', $academicYear);
                }
                if ($semester) {
                    $q->where('semester', $semester);
                }
            })
            ->whereNotNull('comments')
            ->orderByDesc('created_at');

        $comments = $query->get()->map(function ($f) {
            return [
                'id' => $f->id,
                'comments' => $f->comments,
                'anonymous' => (bool) $f->anonymous,
                'created_at' => $f->created_at,
                'student' => $f->anonymous ? null : [
                    'id' => $f->student?->id,
                    'name' => $f->student?->name,
                ],
                'evaluation' => [
                    'id' => $f->evaluation->id,
                    'teacher_id' => $f->evaluation->teacher_id,
                    'academic_year' => $f->evaluation->academic_year,
                    'semester' => $f->evaluation->semester,
                ]
            ];
        });

        return response()->json([
            'course_id' => $course->id,
            'filters' => [
                'teacher_id' => $teacherId,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ],
            'count' => $comments->count(),
            'comments' => $comments,
        ]);
    }
}
