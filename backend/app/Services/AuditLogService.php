<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * Log an action to the audit trail
     */
    public function log(
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        ?int $userId = null,
        ?string $userType = null,
        ?array $details = null,
        ?Request $request = null
    ): AuditLog {
        $logData = [
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'user_id' => $userId,
            'user_type' => $userType,
            'details' => $details,
        ];

        // Add request information if available
        if ($request) {
            $logData['ip_address'] = $request->ip();
            $logData['user_agent'] = $request->userAgent();
        }

        return AuditLog::create($logData);
    }

    /**
     * Log feedback submission
     */
    public function logFeedbackSubmission(int $feedbackId, int $studentId, int $evaluationId, ?Request $request = null): AuditLog
    {
        return $this->log(
            'feedback_submitted',
            'feedback',
            $feedbackId,
            $studentId,
            'student',
            [
                'evaluation_id' => $evaluationId,
                'action_type' => 'create'
            ],
            $request
        );
    }

    /**
     * Log evaluation submission
     */
    public function logEvaluationSubmission(int $submissionId, int $studentId, int $evaluationId, ?Request $request = null): AuditLog
    {
        return $this->log(
            'evaluation_submitted',
            'evaluation_submission',
            $submissionId,
            $studentId,
            'student',
            [
                'evaluation_id' => $evaluationId,
                'action_type' => 'create'
            ],
            $request
        );
    }

    /**
     * Log analytics access
     */
    public function logAnalyticsAccess(int $evaluationId, ?int $userId = null, ?string $userType = null, ?Request $request = null): AuditLog
    {
        return $this->log(
            'analytics_viewed',
            'evaluation',
            $evaluationId,
            $userId,
            $userType,
            [
                'action_type' => 'view'
            ],
            $request
        );
    }

    /**
     * Log export action
     */
    public function logExportAction(int $evaluationId, string $format, ?int $userId = null, ?string $userType = null, ?Request $request = null): AuditLog
    {
        return $this->log(
            'evaluation_exported',
            'evaluation',
            $evaluationId,
            $userId,
            $userType,
            [
                'export_format' => $format,
                'action_type' => 'export'
            ],
            $request
        );
    }

    /**
     * Log submission status check
     */
    public function logSubmissionStatusCheck(int $evaluationId, int $studentId, ?Request $request = null): AuditLog
    {
        return $this->log(
            'submission_status_checked',
            'evaluation',
            $evaluationId,
            $studentId,
            'student',
            [
                'action_type' => 'view'
            ],
            $request
        );
    }
}