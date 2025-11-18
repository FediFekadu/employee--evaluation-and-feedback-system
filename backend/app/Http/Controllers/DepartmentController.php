<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return Department::orderBy('name')->get();
    }

    public function show(Department $department)
    {
        return $department->load(['courses', 'teachers', 'students']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
        ]);
        $dept = Department::create($data);
        return response()->json($dept, 201);
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code,' . $department->id,
        ]);
        $department->update($data);
        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(['message' => 'Department deleted']);
    }

    // Assign or create a department admin for a department
    public function assignAdmin(Request $request, Department $department)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        // Find existing user by email or create minimal user record
        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            $user = User::create([
                'name' => $data['name'] ?? $data['email'],
                'email' => $data['email'],
                // Hashing here would require Hash facade; to keep minimal, set a placeholder.
                // In production, enforce password set/reset flow.
                'password' => bcrypt($data['password'] ?? uniqid('dept_admin_', true)),
                'role' => 'department_admin',
                'department_id' => $department->id,
            ]);
        } else {
            $user->role = 'department_admin';
            $user->department_id = $department->id;
            $user->save();
        }

        return response()->json(['message' => 'Department admin assigned', 'user' => $user->only(['id','name','email','role','department_id'])]);
    }

    // List all department admins with their assigned department
    public function listAdmins()
    {
        $admins = User::where('role', 'department_admin')
            ->with('department')
            ->orderBy('name')
            ->get();

        return response()->json($admins);
    }

    // Update department admin details or reassign to another department
    public function updateAdmin(Request $request, User $user)
    {
        if ($user->role !== 'department_admin') {
            return response()->json(['message' => 'User is not a department admin'], 422);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }
        if (array_key_exists('password', $data) && $data['password']) {
            $user->password = bcrypt($data['password']);
        }
        if (array_key_exists('department_id', $data)) {
            $user->department_id = $data['department_id'];
        }

        $user->save();

        return response()->json($user->only(['id','name','email','role','department_id']));
    }

    // Delete a department admin
    public function deleteAdmin(User $user)
    {
        if ($user->role !== 'department_admin') {
            return response()->json(['message' => 'User is not a department admin'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'Department admin deleted']);
    }
}