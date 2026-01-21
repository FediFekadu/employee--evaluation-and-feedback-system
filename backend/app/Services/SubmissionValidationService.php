<?php

namespace App\Services;

use App\Models\EvaluationSubmission;
use App\Models\Feedback;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SubmissionValidationService
{
    /**
     * Validate if a student is eligible to submit an evaluation.
     * 
     * @param int $studentId
     * @param int $evaluationId
     * @return bool
     * @throws \Exception
     */
    public function validateSubmissionEligibility(int $studentId, int $evaluationId): bool
    {
        try {
            // Check if the student has already submitted for this evaluation
            $existingSubmission = EvaluationSubmission::where('student_id', $studentId)
                ->where('evaluation_id', $evaluationId)
                ->first();

            return $existingSubmission === null;
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during submission eligibility check', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Unable to verify submission eligibility due to database error');
        } catch (\Exception $e) {
            \Log::error('Unexpected error during submission eligibility check', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Unable to verify submission eligibility');
        }
    }

    /**
     * Mark a submission as complete and create the submission record.
     * 
     * @param int $studentId
     * @param int $evaluationId
     * @param bool $isAnonymous
     * @return EvaluationSubmission
     * @throws \Exception
     */
    public function markSubmissionComplete(int $studentId, int $evaluationId, bool $isAnonymous = true): EvaluationSubmission
    {
        try {
            return DB::transaction(function () use ($studentId, $evaluationId, $isAnonymous) {
                // Double-check eligibility within transaction
                if (!$this->validateSubmissionEligibility($studentId, $evaluationId)) {
                    throw new \Exception('Duplicate submission detected: Student has already submitted for this evaluation');
                }

                // Create submission hash for integrity verification
                $submissionHash = Hash::make($studentId . $evaluationId . Carbon::now()->timestamp);

                // Create the submission record
                $submission = EvaluationSubmission::create([
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'submitted_at' => Carbon::now(),
                    'is_anonymous' => $isAnonymous,
                    'submission_hash' => $submissionHash,
                ]);

                // Lock any existing feedback records for this student-evaluation combination
                $updatedCount = Feedback::where('student_id', $studentId)
                    ->where('evaluation_id', $evaluationId)
                    ->update([
                        'submission_id' => $submission->id,
                        'is_locked' => true,
                    ]);

                \Log::info('Submission marked complete', [
                    'submission_id' => $submission->id,
                    'student_id' => $studentId,
                    'evaluation_id' => $evaluationId,
                    'feedback_records_locked' => $updatedCount
                ]);

                return $submission;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during submission completion', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            
            // Check for specific database constraint violations
            if (str_contains($e->getMessage(), 'unique_submission')) {
                throw new \Exception('Duplicate submission prevented: This evaluation has already been submitted');
            }
            
            throw new \Exception('Unable to complete submission due to database error');
        } catch (\Exception $e) {
            \Log::error('Unexpected error during submission completion', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get the submission status for a student and evaluation.
     * 
     * @param int $studentId
     * @param int $evaluationId
     * @return array
     * @throws \Exception
     */
    public function getSubmissionStatus(int $studentId, int $evaluationId): array
    {
        try {
            $submission = EvaluationSubmission::where('student_id', $studentId)
                ->where('evaluation_id', $evaluationId)
                ->first();

            if ($submission) {
                return [
                    'has_submitted' => true,
                    'submitted_at' => $submission->submitted_at,
                    'is_anonymous' => $submission->is_anonymous,
                    'submission_id' => $submission->id,
                    'submission_hash' => $submission->submission_hash,
                ];
            }

            return [
                'has_submitted' => false,
                'submitted_at' => null,
                'is_anonymous' => null,
                'submission_id' => null,
                'submission_hash' => null,
            ];
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during submission status check', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Unable to retrieve submission status due to database error');
        } catch (\Exception $e) {
            \Log::error('Unexpected error during submission status check', [
                'student_id' => $studentId,
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Unable to retrieve submission status');
        }
    }

    /**
     * Validate submission integrity using hash verification.
     * 
     * @param int $submissionId
     * @return bool
     */
    public function validateSubmissionIntegrity(int $submissionId): bool
    {
        try {
            $submission = EvaluationSubmission::find($submissionId);
            if (!$submission) {
                return false;
            }

            // Verify the submission hash hasn't been tampered with
            $expectedHash = Hash::make($submission->student_id . $submission->evaluation_id . $submission->submitted_at->timestamp);
            return Hash::check($submission->student_id . $submission->evaluation_id . $submission->submitted_at->timestamp, $submission->submission_hash);
        } catch (\Exception $e) {
            \Log::error('Error validating submission integrity', [
                'submission_id' => $submissionId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get detailed submission statistics for monitoring.
     * 
     * @param int $evaluationId
     * @return array
     */
    public function getSubmissionStatistics(int $evaluationId): array
    {
        try {
            $totalSubmissions = EvaluationSubmission::where('evaluation_id', $evaluationId)->count();
            $anonymousSubmissions = EvaluationSubmission::where('evaluation_id', $evaluationId)
                ->where('is_anonymous', true)
                ->count();
            
            $submissionsByHour = EvaluationSubmission::where('evaluation_id', $evaluationId)
                ->selectRaw('HOUR(submitted_at) as hour, COUNT(*) as count')
                ->groupBy('hour')
                ->orderBy('hour')
                ->get()
                ->pluck('count', 'hour')
                ->toArray();

            return [
                'total_submissions' => $totalSubmissions,
                'anonymous_submissions' => $anonymousSubmissions,
                'identified_submissions' => $totalSubmissions - $anonymousSubmissions,
                'anonymity_rate' => $totalSubmissions > 0 ? round(($anonymousSubmissions / $totalSubmissions) * 100, 2) : 0,
                'submissions_by_hour' => $submissionsByHour,
                'peak_submission_hour' => !empty($submissionsByHour) ? array_keys($submissionsByHour, max($submissionsByHour))[0] : null,
            ];
        } catch (\Exception $e) {
            \Log::error('Error generating submission statistics', [
                'evaluation_id' => $evaluationId,
                'error' => $e->getMessage()
            ]);
            return [
                'total_submissions' => 0,
                'anonymous_submissions' => 0,
                'identified_submissions' => 0,
                'anonymity_rate' => 0,
                'submissions_by_hour' => [],
                'peak_submission_hour' => null,
            ];
        }
    }
}