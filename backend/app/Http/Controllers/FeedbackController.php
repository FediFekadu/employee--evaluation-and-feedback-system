<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'student_id' => 'nullable|exists:students,id',
            'anonymous' => 'boolean',
            'responses' => 'array',
            'responses.*.question_id' => 'required|exists:questions,id',
            'responses.*.rating' => 'nullable|integer|min:1|max:5',
            'responses.*.text' => 'nullable|string',
        ]);
        // Gate feedback submission by evaluation open window
        $evaluation = \App\Models\Evaluation::findOrFail($data['evaluation_id']);
        $today = now()->toDateString();
        $isOpen = $evaluation->opened_at <= $today && (is_null($evaluation->closed_at) || $evaluation->closed_at >= $today);
        if (!$isOpen) {
            return response()->json(['message' => 'Evaluation window is closed'], 422);
        }

        $feedback = Feedback::create([
            'evaluation_id' => $data['evaluation_id'],
            'student_id' => $data['student_id'] ?? null,
            'anonymous' => $data['anonymous'] ?? true,
        ]);

        foreach (($data['responses'] ?? []) as $resp) {
            $feedback->responses()->create($resp);
        }

        return response()->json($feedback->load('responses'), 201);
    }
}