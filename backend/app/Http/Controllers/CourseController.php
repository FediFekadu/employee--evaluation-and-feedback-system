<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Teacher;
use Illuminate\Http\Request;

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

        // Attach without detaching existing instructors
        $course->teachers()->syncWithoutDetaching([$teacher->id]);

        // Reload relations to return updated course info
        $course->load('department', 'teachers');

        return response()->json([
            'message' => 'Instructor assigned successfully',
            'course' => $course,
        ]);
    }
}