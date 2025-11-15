<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
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

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $user = $request->user();
        return response()->json(['user' => $user]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }
}