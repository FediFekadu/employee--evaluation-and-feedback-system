<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HodEvaluation;
use App\Models\Department;
use App\Models\HodEvaluationResponse;

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
     * Create HOD evaluations for all teachers in the department for a specific term.
     */
    public function store(Request $request, Department $department)
    {
        $data = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'due_date' => 'nullable|date',
        ]);

        $teachers = $department->teachers;
        $count = 0;

        foreach ($teachers as $teacher) {
            $exists = HodEvaluation::where('department_id', $department->id)
                ->where('teacher_id', $teacher->id)
                ->where('academic_year', $data['academic_year'])
                ->where('semester', $data['semester'])
                ->exists();

            if (!$exists) {
                HodEvaluation::create([
                    'department_id' => $department->id,
                    'teacher_id' => $teacher->id,
                    'academic_year' => $data['academic_year'],
                    'semester' => $data['semester'],
                    'opened_at' => now(),
                    'closed_at' => $data['due_date'] ?? null,
                    'status' => 'open',
                ]);
                $count++;
            }
        }

        return response()->json([
            'message' => "{$count} HOD evaluations created for {$data['academic_year']} - {$data['semester']}",
            'count' => $count
        ]);
    }

    /**
     * Get single HOD evaluation details including responses.
     */
    public function show(HodEvaluation $hodEvaluation)
    {
        return $hodEvaluation->load(['teacher', 'responses', 'department']);
    }

    /**
     * Submit HOD evaluation with responses and calculate score.
     */
    public function submitEvaluation(Request $request, HodEvaluation $hodEvaluation)
    {
        $data = $request->validate([
            'responses' => 'required|array',
            'responses.*.question_id' => 'required|exists:hod_template_questions,id',
            'responses.*.rating' => 'nullable|integer|min:1|max:5',
            'responses.*.text' => 'nullable|string',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:open,submitted'
        ]);

        $totalRating = 0;
        $ratingCount = 0;
        
        foreach ($data['responses'] as $resp) {
             HodEvaluationResponse::updateOrCreate(
                [
                    'hod_evaluation_id' => $hodEvaluation->id,
                    'hod_template_question_id' => $resp['question_id']
                ],
                [
                    'rating' => $resp['rating'] ?? null,
                    'text' => $resp['text'] ?? null
                ]
            );
            
            if (isset($resp['rating']) && is_numeric($resp['rating'])) {
                $totalRating += $resp['rating'];
                $ratingCount++;
            }
        }
        
        // Calculate score on 100 scale: (Average Rating / 5) * 100
        $score = $ratingCount > 0 ? ($totalRating / $ratingCount) * 20 : 0;
        
        $hodEvaluation->update([
            'score' => $score,
            'remarks' => $data['remarks'] ?? $hodEvaluation->remarks,
            'status' => $data['status'] ?? 'submitted',
            'hod_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'HOD evaluation submitted successfully',
            'evaluation' => $hodEvaluation->load('responses')
        ]);
    }
}
