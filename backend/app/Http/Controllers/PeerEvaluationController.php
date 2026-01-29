<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PeerEvaluation;
use App\Models\PeerEvaluationAssignee;
use App\Models\PeerEvaluationResponse;
use App\Models\DepartmentPeerEvaluationTemplate;
use App\Models\Evaluation;
use App\Models\Teacher;
use Illuminate\Support\Facades\Cache;

class PeerEvaluationController extends Controller
{
    /**
     * List peer evaluations assigned to the given evaluator teacher.
     * Supports filtering for currently open/released evaluations.
     */
    public function listAssigned(Request $request, Teacher $teacher)
    {
        $peerIds = PeerEvaluationAssignee::where('evaluator_teacher_id', $teacher->id)
            ->pluck('peer_evaluation_id');

        $query = PeerEvaluation::with(['teacher', 'department'])
            ->whereIn('id', $peerIds);

        // Filter by open window and status if requested
        if ($request->boolean('released_only') || $request->boolean('open_only')) {
            $today = now()->toDateString();
            $query->whereDate('opened_at', '<=', $today)
                  ->where(function ($q) use ($today) {
                      $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
                  })
                  ->whereIn('status', ['open', 'released']);
        }

        $items = $query->orderByDesc('opened_at')->paginate(20);

        // Attach assignee submission status for the requesting teacher
        $items->getCollection()->transform(function ($ev) use ($teacher) {
            $assignee = PeerEvaluationAssignee::where('peer_evaluation_id', $ev->id)
                ->where('evaluator_teacher_id', $teacher->id)
                ->first();

            // Provide convenient flags for frontend display
            $ev->setAttribute('assignee_status', $assignee ? $assignee->status : null);
            $ev->setAttribute('responded_at', $assignee ? $assignee->responded_at : null);
            $ev->setAttribute('submitted', $assignee ? $assignee->status === 'completed' : false);
            return $ev;
        });

        return response()->json([
            'data' => $items,
        ]);
    }
    /**
     * Show a peer evaluation including assignees and basic info.
     */
    public function show(PeerEvaluation $peerEvaluation)
    {
        $peerEvaluation->load(['teacher', 'department']);
        $assignees = PeerEvaluationAssignee::with('evaluator')
            ->where('peer_evaluation_id', $peerEvaluation->id)
            ->get();

        return response()->json([
            'evaluation' => $peerEvaluation,
            'assignees' => $assignees,
        ]);
    }

    /**
     * Get questions for a peer evaluation based on department's active template.
     */
    public function questions(PeerEvaluation $peerEvaluation)
    {
        $template = DepartmentPeerEvaluationTemplate::getActiveTemplate($peerEvaluation->department_id);
        if (!$template) {
            return response()->json([
                'questions' => [],
                'form_info' => null,
                'message' => 'No active peer template for department'
            ], 404);
        }

        return response()->json([
            'questions' => $template->questions()->get(),
            'form_info' => $template->form_info,
            'template_name' => $template->name,
        ]);
    }

    /**
     * Submit peer responses from an assigned evaluator and compute score.
     */
    public function submitResponses(Request $request, PeerEvaluation $peerEvaluation)
    {
        $data = $request->validate([
            'evaluator_teacher_id' => 'required|exists:teachers,id',
            'responses' => 'required|array|min:1',
            'responses.*.question_id' => 'required|integer',
            'responses.*.rating' => 'nullable|numeric|min:1|max:5',
            'responses.*.text' => 'nullable|string'
        ]);

        // Ensure evaluator is assigned to this peer evaluation
        $assignee = PeerEvaluationAssignee::where('peer_evaluation_id', $peerEvaluation->id)
            ->where('evaluator_teacher_id', $data['evaluator_teacher_id'])
            ->first();

        if (!$assignee) {
            return response()->json(['message' => 'Evaluator not assigned to this peer evaluation'], 403);
        }
        if ($assignee->status === 'completed') {
            return response()->json(['message' => 'Responses already submitted'], 409);
        }

        // Load template questions to validate and compute score
        $template = DepartmentPeerEvaluationTemplate::getActiveTemplate($peerEvaluation->department_id);
        if (!$template) {
            return response()->json(['message' => 'No active peer template'], 400);
        }
        $questionMap = $template->questions->keyBy('id');

        // Compute average rating score (percentage)
        $validRatings = [];
        foreach ($data['responses'] as $resp) {
            $qid = $resp['question_id'];
            if (!$questionMap->has($qid)) {
                // Ignore responses to unknown questions
                continue;
            }
            $q = $questionMap[$qid];
            if ($q->type === 'rating' && isset($resp['rating'])) {
                $rating = floatval($resp['rating']);
                if ($rating >= 1 && $rating <= 5) {
                    $validRatings[] = $rating;
                }
            }
        }
        $score = 0.0;
        if (count($validRatings) > 0) {
            $avg = array_sum($validRatings) / count($validRatings);
            $score = round(($avg / 5) * 100, 2);
        }

        // Save response and update assignee atomically
        return DB::transaction(function () use ($peerEvaluation, $data, $score, $assignee) {
            $response = PeerEvaluationResponse::create([
                'peer_evaluation_id' => $peerEvaluation->id,
                'evaluator_teacher_id' => $data['evaluator_teacher_id'],
                'responses' => $data['responses'],
                'score' => $score,
                'submitted_at' => now(),
            ]);

            $assignee->update([
                'responded_at' => now(),
                'status' => 'completed',
            ]);

            // Invalidate cached weighted/comprehensive results for all evaluations of this teacher in the same period
            $affectedEvaluationIds = Evaluation::where('teacher_id', $peerEvaluation->teacher_id)
                ->where('academic_year', $peerEvaluation->academic_year)
                ->where('semester', $peerEvaluation->semester)
                ->pluck('id');

            foreach ($affectedEvaluationIds as $eid) {
                Cache::forget("weighted_scores_{$eid}");
                Cache::forget("comprehensive_results_{$eid}");
            }

            return response()->json([
                'message' => 'Peer responses submitted',
                'score' => $score,
                'response' => $response,
            ], 201);
        });
    }
}