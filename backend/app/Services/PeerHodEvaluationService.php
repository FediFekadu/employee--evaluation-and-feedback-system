<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\PeerEvaluation;
use App\Models\PeerEvaluationAssignee;
use App\Models\HodEvaluation;
use App\Models\DepartmentPeerEvaluationTemplate;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PeerHodEvaluationService
{
    /**
     * Initialize peer and HOD evaluations for a given standard course evaluation.
     * - Peer: assign all teachers in department except evaluated teacher
     * - HOD: create record for HOD scoring (single per semester)
     */
    public function initializeForEvaluation(Evaluation $evaluation): void
    {
        $departmentId = (int) ($evaluation->department_id ?? $evaluation->course?->department_id);
        if (!$departmentId) {
            Log::warning('Peer/HOD init skipped: missing department_id', ['evaluation_id' => $evaluation->id]);
            return;
        }

        $teacherId = (int) $evaluation->teacher_id;
        $academicYear = (string) $evaluation->academic_year;
        $semester = (string) $evaluation->semester;
        $openedAt = $evaluation->opened_at;
        $closedAt = $evaluation->closed_at;

        DB::transaction(function () use ($departmentId, $teacherId, $academicYear, $semester, $openedAt, $closedAt) {
            // 1) Peer Evaluation (once per semester per teacher)
            $peer = PeerEvaluation::firstOrCreate(
                [
                    'department_id' => $departmentId,
                    'teacher_id' => $teacherId,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                ],
                [
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                    'status' => 'open',
                    'template_id' => DepartmentPeerEvaluationTemplate::getActiveTemplate($departmentId)?->id,
                ]
            );

            // Assign all other teachers in the department as evaluators
            $teacherIds = Teacher::where('department_id', $departmentId)
                ->where('id', '!=', $teacherId)
                ->pluck('id')
                ->all();

            foreach ($teacherIds as $evaluatorId) {
                PeerEvaluationAssignee::firstOrCreate(
                    [
                        'peer_evaluation_id' => $peer->id,
                        'evaluator_teacher_id' => $evaluatorId,
                    ],
                    [
                        'status' => 'pending',
                        'invited_at' => now(),
                    ]
                );
            }

            // 2) HOD Evaluation (single per semester per teacher)
            HodEvaluation::firstOrCreate(
                [
                    'department_id' => $departmentId,
                    'teacher_id' => $teacherId,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                ],
                [
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                    'status' => 'open',
                    'score' => null,
                    'remarks' => null,
                    'template_id' => null,
                ]
            );
        });
    }
}