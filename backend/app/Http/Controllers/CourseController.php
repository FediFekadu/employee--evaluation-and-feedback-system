<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
        // Teachers relation includes pivot year_level and semester via Model configuration
        return Course::with('department', 'teachers')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'title' => 'required|string',
            'code' => 'required|string|unique:courses,code',
            'description' => 'nullable|string',
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
        // Teachers relation includes pivot year_level and semester via Model configuration
        return $course->load('department', 'teachers', 'evaluations');
    }

    public function assignTeacher(Request $request, $id)
    {
        $course = Course::with('department')->findOrFail($id);

        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'year_level' => 'required|integer|min:1|max:5',
            'semester' => 'required|string|max:20',
        ]);

        $teacher = \App\Models\Teacher::with('department')->findOrFail($validated['teacher_id']);

        if ($teacher->department_id !== $course->department_id) {
            return response()->json([
                'message' => 'Teacher and course must be in the same department.'
            ], 422);
        }

        $course->teachers()->syncWithoutDetaching([
            $teacher->id => [
                'year_level' => $validated['year_level'],
                'semester' => $validated['semester'],
            ],
        ]);

        $course->load('teachers');

        return response()->json([
            'message' => 'Instructor assigned with year and semester.',
            'course' => $course,
        ], 201);
    }
}