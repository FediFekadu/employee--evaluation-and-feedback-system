<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HodEvaluation;
use App\Models\Department;

class HodEvaluationController extends Controller
{
    /**
     * List HOD evaluations for a department with optional term filters.
     */
    public function index(Request $request, Department $department)
    {
        $query = HodEvaluation::where('department_id', $department->id)
            ->with(['teacher']);

        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->get('academic_year'));
        }
        if ($request->filled('semester')) {
            $query->where('semester', $request->get('semester'));
        }
        if ($request->boolean('open_only')) {
            $today = now()->toDateString();
            $query->whereDate('opened_at', '<=', $today)
                  ->where(function ($q) use ($today) {
                      $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
                  })
                  ->where('status', 'open');
        }

        return $query->orderByDesc('opened_at')->paginate(20);
    }

    /**
     * Set HOD score and optional remarks for a HOD evaluation.
     */
    public function setScore(Request $request, HodEvaluation $hodEvaluation)
    {
        $data = $request->validate([
            'score' => 'required|numeric|min:0|max:100',
            'remarks' => 'nullable|string'
        ]);

        // TODO: Add role/middleware checks for HOD or department_admin
        $hodEvaluation->update([
            'score' => $data['score'],
            'remarks' => $data['remarks'] ?? $hodEvaluation->remarks,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'HOD score saved',
            'evaluation' => $hodEvaluation
        ], 200);
    }
}