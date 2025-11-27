<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    // List teachers, optionally filter by department_id
    public function index(Request $request)
    {
        $deptId = $request->query('department_id');
        $query = Teacher::with('department')->orderBy('name');
        if ($deptId) {
            $query->where('department_id', $deptId);
        }
        return $query->get();
    }

    // Create a new teacher (instructor)
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:teachers,email',
            'title' => 'nullable|string|max:255',
            'department_id' => 'required|exists:departments,id',
        ]);

        $teacher = Teacher::create($data);

        // Create or link a user account for this instructor with a default password
        $defaultPassword = 'teacher123';
        $user = User::where('email', $data['email'])->first();
        $createdNewUser = false;
        if (!$user) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt($defaultPassword),
                'role' => 'teacher',
                'department_id' => $data['department_id'],
                'teacher_id' => $teacher->id,
            ]);
            $createdNewUser = true;
        } else {
            // Reuse existing account, link as teacher
            $user->role = 'teacher';
            $user->department_id = $data['department_id'];
            $user->teacher_id = $teacher->id;
            $user->save();
        }

        $teacher = $teacher->load('department');
        $out = $teacher->toArray();
        $out['user'] = $user->only(['id', 'name', 'email', 'role', 'department_id', 'teacher_id']);
        $out['default_password'] = $createdNewUser ? $defaultPassword : null;
        return response()->json($out, 201);
    }

    // Show a teacher with department and assigned courses
    public function show(Teacher $teacher)
    {
        // Load department and courses (including pivot data if defined on the relation)
        return $teacher->load(['department', 'courses']);
    }
}