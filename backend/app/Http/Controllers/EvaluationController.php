<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        return Evaluation::with('course', 'teacher')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'teacher_id' => 'required|exists:teachers,id',
            'semester' => 'required|string',
            'opened_at' => 'required|date',
            'closed_at' => 'nullable|date',
        ]);
        $evaluation = Evaluation::create($data);
        return response()->json($evaluation, 201);
    }

    public function show(Evaluation $evaluation)
    {
        return $evaluation->load('course', 'teacher', 'questions', 'feedbacks');
    }
}