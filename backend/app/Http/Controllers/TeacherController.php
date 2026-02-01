<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            // Allow larger images during instructor creation to reduce 422 errors
            'photo' => 'nullable|image|max:8192',
        ]);

        $teacher = Teacher::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'title' => $data['title'] ?? null,
            'department_id' => $data['department_id'],
        ]);

        // Optional photo upload during creation
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('teacher_photos', 'public');
            $teacher->photo_url = Storage::url($path);
            $teacher->save();
        }

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
        $teacher->load(['department', 'courses']);

        // Also include evaluations associated with this teacher (with course relation)
        // This helps the frontend display counts and recent activity compactly.
        $evaluations = \App\Models\Evaluation::with(['course'])
            ->where('teacher_id', $teacher->id)
            ->orderByDesc('opened_at')
            ->get();

        $out = $teacher->toArray();
        $out['evaluations'] = $evaluations->toArray();
        return response()->json($out);
    }

    // Upload or update a teacher's profile photo
    public function uploadPhoto(Request $request, Teacher $teacher)
    {
        $request->validate([
            // Accept common web image formats explicitly, up to ~8 MB
            'photo' => 'required|mimes:jpeg,jpg,png,webp,gif|max:8192',
        ], [
            'photo.required' => 'Select an image file to upload.',
            'photo.mimes' => 'Please upload a JPEG, PNG, WebP, or GIF image.',
            'photo.max' => 'The photo may not be greater than 8 MB.',
        ]);

        // Store on public disk so the frontend can access via URL
        $path = $request->file('photo')->store('teacher_photos', 'public');
        $teacher->photo_url = Storage::url($path);
        $teacher->save();

        return response()->json($teacher->load('department'));
    }
}