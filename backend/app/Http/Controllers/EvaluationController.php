<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Question;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        $query = Evaluation::with('course', 'teacher');
        // Optional filters: department_id, academic_year, semester, open_only
        if (request()->has('department_id')) {
            $deptId = (int) request()->get('department_id');
            $query->whereHas('course', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }
        if (request()->has('academic_year')) {
            $query->where('academic_year', request()->get('academic_year'));
        }
        if (request()->has('semester')) {
            $query->where('semester', request()->get('semester'));
        }
        if (request()->has('year_level')) {
            $query->where('year_level', (int) request()->get('year_level'));
        }
        if (request()->boolean('open_only')) {
            $today = now()->toDateString();
            $query->whereDate('opened_at', '<=', $today)
                  ->where(function ($q) use ($today) {
                      $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
                  });
        }

        return $query->orderByDesc('opened_at')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'teacher_id' => 'required|exists:teachers,id',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'year_level' => 'required|integer|min:1|max:6',
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

    public function update(Request $request, Evaluation $evaluation)
    {
        // Allow updating academic_year, semester, and open/close dates
        $data = $request->validate([
            'academic_year' => 'sometimes|required|string',
            'semester' => 'sometimes|required|string',
            'year_level' => 'nullable|integer|min:1|max:6',
            'opened_at' => 'sometimes|required|date',
            'closed_at' => 'nullable|date',
        ]);
        $evaluation->update($data);
        return response()->json($evaluation);
    }

    /**
     * Replace evaluation form questions.
     */
    public function setQuestions(Request $request, Evaluation $evaluation)
    {
        $payload = $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:rating,text',
        ]);

        // Detach existing questions
        $evaluation->questions()->detach();

        // Create and attach new questions
        $questionIds = [];
        foreach ($payload['questions'] as $q) {
            $question = Question::create([
                'text' => $q['text'],
                'type' => $q['type'],
            ]);
            $questionIds[] = $question->id;
        }
        $evaluation->questions()->attach($questionIds);

        return response()->json([
            'evaluation_id' => $evaluation->id,
            'questions' => $evaluation->questions()->get(),
        ]);
    }

    public function summary(Evaluation $evaluation)
    {
        // Aggregate ratings per question and overall counts
        $evaluation->load('feedbacks.responses');
        $feedbacks = $evaluation->feedbacks;

        $totalFeedbacks = $feedbacks->count();
        $responseAgg = [];
        foreach ($feedbacks as $fb) {
            foreach ($fb->responses as $resp) {
                $qid = $resp->question_id;
                if (!isset($responseAgg[$qid])) {
                    $responseAgg[$qid] = ['count' => 0, 'sum' => 0, 'texts' => []];
                }
                if (!is_null($resp->rating)) {
                    $responseAgg[$qid]['count'] += 1;
                    $responseAgg[$qid]['sum'] += (int) $resp->rating;
                }
                if (!empty($resp->text)) {
                    // Keep up to 5 sample comments per question
                    if (count($responseAgg[$qid]['texts']) < 5) {
                        $responseAgg[$qid]['texts'][] = $resp->text;
                    }
                }
            }
        }

        $questionSummaries = [];
        foreach ($responseAgg as $qid => $agg) {
            $avg = $agg['count'] > 0 ? round($agg['sum'] / $agg['count'], 2) : null;
            $questionSummaries[] = [
                'question_id' => $qid,
                'average_rating' => $avg,
                'responses_count' => $agg['count'],
                'sample_comments' => $agg['texts'],
            ];
        }

        return response()->json([
            'evaluation_id' => $evaluation->id,
            'course' => $evaluation->course,
            'teacher' => $evaluation->teacher,
            'academic_year' => $evaluation->academic_year,
            'semester' => $evaluation->semester,
            'opened_at' => $evaluation->opened_at,
            'closed_at' => $evaluation->closed_at,
            'total_feedbacks' => $totalFeedbacks,
            'questions' => $questionSummaries,
        ]);
    }
}