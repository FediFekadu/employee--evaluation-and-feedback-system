<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    /**
     * Get all students
     */
    public function index()
    {
        $students = Student::with(['department'])->get();
        return response()->json($students);
    }

    /**
     * Create a new student within a department and bootstrap a login user.
     */
    public function store(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'student_id' => 'required|string|max:50|unique:students,student_id',
            'year_level' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|in:1,2',
            'default_password' => 'required|string|min:6',
        ]);

        $student = Student::create([
            'department_id' => $department->id,
            'name' => $data['name'],
            'email' => 'student_' . $data['student_id'] . '@students.local',
            'student_id' => $data['student_id'],
            'year_level' => $data['year_level'],
            'semester' => $data['semester'],
        ]);

        // Ensure a corresponding user exists for authentication.
        $syntheticEmail = 'student_' . $student->student_id . '@students.local';
        $user = User::firstOrCreate(
            ['student_id' => $student->id],
            [
                'name' => $student->name,
                // users.email is required by base migration; use synthetic unique email
                'email' => $syntheticEmail,
                'password' => Hash::make($data['default_password']),
                'role' => 'student',
                'department_id' => $department->id,
            ]
        );

        return response()->json(['student' => $student, 'user' => $user], 201);
    }

    /**
     * Update a student's details (e.g., year_level and semester).
     */
    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'student_id' => 'sometimes|string|max:50|unique:students,student_id,' . $student->id,
            'year_level' => 'sometimes|integer|min:1|max:6',
            'semester' => 'sometimes|integer|in:1,2',
        ]);

        $student->fill($data);
        $student->save();

        return response()->json($student->load('department'));
    }
}