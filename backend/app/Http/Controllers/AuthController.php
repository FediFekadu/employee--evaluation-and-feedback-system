<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function loginStudentPassword(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|string',
            'password' => 'required|string',
        ]);

        $student = Student::where('student_id', $data['student_id'])->first();
        if (!$student) {
            return response()->json(['message' => 'Invalid student credentials'], 422);
        }

        $user = User::where('student_id', $student->id)->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid student credentials'], 422);
        }

        Auth::login($user);
        return response()->json([
            'user' => $user,
            'student' => $student,
        ]);
    }

    public function loginStudent(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|string',
            'name' => 'required|string',
        ]);

        $student = Student::where('student_id', $data['student_id'])
            ->where('name', $data['name'])
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Invalid student credentials'], 422);
        }

        $user = User::firstOrCreate(
            ['student_id' => $student->id],
            [
                'name' => $student->name,
                'email' => $student->email ?? null,
                'password' => Hash::make(uniqid('student_', true)),
                'role' => 'student',
                'department_id' => $student->department_id,
            ]
        );

        Auth::login($user);

        return response()->json(['user' => $user]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        // Manually validate credentials to avoid session-guard quirks in API routes
        $user = User::where('email', $credentials['email'])->first();
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        // Allow specific roles to use email/password login
        // Admins and instructors sign in here; students use dedicated endpoints
        $allowedRoles = ['superadmin', 'college_admin', 'department_admin', 'teacher'];
        if (!in_array($user->role, $allowedRoles, true)) {
            return response()->json(['message' => 'Unauthorized role'], 403);
        }

        Auth::login($user);
        return response()->json(['user' => $user]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Hash::check($data['old_password'], $user->password)) {
            return response()->json(['message' => 'Invalid current password'], 422);
        }
        $user->password = Hash::make($data['new_password']);
        $user->save();
        return response()->json(['message' => 'Password changed']);
    }
}