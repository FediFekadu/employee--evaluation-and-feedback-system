<?php

namespace App\Http\Controllers;

use App\Models\Course;
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
}