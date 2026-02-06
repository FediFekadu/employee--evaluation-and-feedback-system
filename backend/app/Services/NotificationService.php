<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Student;
use App\Models\EvaluationSubmission;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class NotificationService
{
    public function createNotification(string $recipientType, int $recipientId, string $type, ?string $title = null, ?string $message = null, array $meta = [], string $priority = 'info'): Notification
    {
        return Notification::create([
            'recipient_type' => $recipientType,
            'recipient_id' => $recipientId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'meta' => $meta,
            'priority' => $priority,
        ]);
    }
    /**
     * Send reminder notifications to students who haven't submitted evaluations.
     * 
     * @param array $evaluationIds
     * @param string $reminderType
     * @param string|null $customMessage
     * @return array
     */
    public function sendEvaluationReminders(array $evaluationIds, string $reminderType = 'notification', ?string $customMessage = null): array
    {
        $sentCount = 0;
        $errors = [];
        $reminderDetails = [];

        foreach ($evaluationIds as $evaluationId) {
            try {
                $evaluation = Evaluation::with(['course.students', 'course.department', 'teacher.user'])->findOrFail($evaluationId);
                
                // Get students who haven't submitted yet
                $eligibleStudents = $evaluation->course->students()
                    ->whereNotExists(function ($query) use ($evaluationId) {
                        $query->select('id')
                              ->from('evaluation_submissions')
                              ->whereColumn('student_id', 'students.id')
                              ->where('evaluation_id', $evaluationId);
                    })
                    ->with('user')
                    ->get();

                $evaluationReminderCount = 0;

                foreach ($eligibleStudents as $student) {
                    $reminderSent = $this->sendIndividualReminder(
                        $student, 
                        $evaluation, 
                        $reminderType, 
                        $customMessage
                    );

                    if ($reminderSent) {
                        $evaluationReminderCount++;
                        $sentCount++;
                    }
                }

                $reminderDetails[] = [
                    'evaluation_id' => $evaluationId,
                    'course_name' => $evaluation->course->name,
                    'teacher_name' => $evaluation->teacher->user->name ?? 'Unknown',
                    'reminders_sent' => $evaluationReminderCount,
                    'eligible_students' => $eligibleStudents->count(),
                    'days_remaining' => $evaluation->closed_at ? now()->diffInDays($evaluation->closed_at) : null,
                ];

            } catch (\Exception $e) {
                $errors[] = [
                    'evaluation_id' => $evaluationId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'total_reminders_sent' => $sentCount,
            'evaluations_processed' => count($evaluationIds),
            'reminder_details' => $reminderDetails,
            'errors' => $errors,
            'sent_at' => Carbon::now(),
        ];
    }

    /**
     * Send individual reminder to a student.
     * 
     * @param Student $student
     * @param Evaluation $evaluation
     * @param string $reminderType
     * @param string|null $customMessage
     * @return bool
     */
    private function sendIndividualReminder(Student $student, Evaluation $evaluation, string $reminderType, ?string $customMessage = null): bool
    {
        try {
            $reminderData = [
                'student_id' => $student->id,
                'student_name' => $student->user->name ?? 'Student',
                'student_email' => $student->user->email ?? null,
                'evaluation_id' => $evaluation->id,
                'course_name' => $evaluation->course->name,
                'course_code' => $evaluation->course->code,
                'teacher_name' => $evaluation->teacher->user->name ?? 'Unknown',
                'department_name' => $evaluation->course->department->name ?? 'Unknown',
                'academic_year' => $evaluation->academic_year,
                'semester' => $evaluation->semester,
                'year_level' => $evaluation->year_level,
                'closed_at' => $evaluation->closed_at,
                'days_remaining' => $evaluation->closed_at ? now()->diffInDays($evaluation->closed_at) : null,
                'custom_message' => $customMessage,
                'reminder_type' => $reminderType,
                'sent_at' => Carbon::now(),
            ];

            // For now, we'll log the reminder (in a real system, this would send actual notifications/emails)
            switch ($reminderType) {
                case 'email':
                    return $this->sendEmailReminder($reminderData);
                case 'notification':
                    return $this->sendInAppNotification($reminderData);
                case 'both':
                    $emailSent = $this->sendEmailReminder($reminderData);
                    $notificationSent = $this->sendInAppNotification($reminderData);
                    return $emailSent || $notificationSent;
                default:
                    return $this->sendInAppNotification($reminderData);
            }

        } catch (\Exception $e) {
            Log::error("Failed to send reminder to student {$student->id} for evaluation {$evaluation->id}", [
                'error' => $e->getMessage(),
                'student_id' => $student->id,
                'evaluation_id' => $evaluation->id,
            ]);
            return false;
        }
    }

    /**
     * Send email reminder (placeholder implementation).
     * 
     * @param array $reminderData
     * @return bool
     */
    private function sendEmailReminder(array $reminderData): bool
    {
        try {
            // In a real implementation, this would use Laravel's Mail facade
            // For now, we'll just log the email reminder
            Log::info("Email reminder sent", [
                'type' => 'email_reminder',
                'student_id' => $reminderData['student_id'],
                'student_email' => $reminderData['student_email'],
                'evaluation_id' => $reminderData['evaluation_id'],
                'course_name' => $reminderData['course_name'],
                'teacher_name' => $reminderData['teacher_name'],
                'days_remaining' => $reminderData['days_remaining'],
                'custom_message' => $reminderData['custom_message'],
                'sent_at' => $reminderData['sent_at'],
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send email reminder", [
                'error' => $e->getMessage(),
                'student_id' => $reminderData['student_id'],
                'evaluation_id' => $reminderData['evaluation_id'],
            ]);
            return false;
        }
    }

    /**
     * Send in-app notification reminder (placeholder implementation).
     * 
     * @param array $reminderData
     * @return bool
     */
    private function sendInAppNotification(array $reminderData): bool
    {
        try {
            $message = $reminderData['custom_message'] ?? 'Evaluation reminder';
            $meta = [
                'evaluation_id' => $reminderData['evaluation_id'],
                'course_name' => $reminderData['course_name'],
                'teacher_name' => $reminderData['teacher_name'],
                'days_remaining' => $reminderData['days_remaining'],
            ];
            $this->createNotification('student', (int) $reminderData['student_id'], 'closing_soon', 'Evaluation Closing Soon', $message, $meta, 'warning');

            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send in-app notification", [
                'error' => $e->getMessage(),
                'student_id' => $reminderData['student_id'],
                'evaluation_id' => $reminderData['evaluation_id'],
            ]);
            return false;
        }
    }

    /**
     * Get reminder statistics for a department.
     * 
     * @param int $departmentId
     * @param string $period
     * @return array
     */
    public function getReminderStatistics(int $departmentId, string $period = 'current_month'): array
    {
        // This would typically query a reminders/notifications table
        // For now, we'll return placeholder data
        return [
            'department_id' => $departmentId,
            'period' => $period,
            'total_reminders_sent' => 0,
            'email_reminders' => 0,
            'in_app_notifications' => 0,
            'response_rate_after_reminder' => 0,
            'most_reminded_evaluations' => [],
            'generated_at' => Carbon::now(),
        ];
    }

    /**
     * Schedule automatic reminders for evaluations nearing closure.
     * 
     * @param int $daysBeforeClosure
     * @param float $participationThreshold
     * @return array
     */
    public function scheduleAutomaticReminders(int $daysBeforeClosure = 3, float $participationThreshold = 50.0): array
    {
        $evaluationsNearingClosure = Evaluation::where('closed_at', '>', now())
            ->where('closed_at', '<=', now()->addDays($daysBeforeClosure))
            ->with(['course.department'])
            ->get();

        $scheduledReminders = [];

        foreach ($evaluationsNearingClosure as $evaluation) {
            // Check participation rate
            $analyticsService = app(EvaluationAnalyticsService::class);
            $participationData = $analyticsService->calculateParticipationRate($evaluation->id);

            if ($participationData['participation_rate'] < $participationThreshold) {
                $scheduledReminders[] = [
                    'evaluation_id' => $evaluation->id,
                    'course_name' => $evaluation->course->name,
                    'department_name' => $evaluation->course->department->name ?? 'Unknown',
                    'current_participation_rate' => $participationData['participation_rate'],
                    'days_until_closure' => now()->diffInDays($evaluation->closed_at),
                    'eligible_students' => $participationData['total_eligible_students'],
                    'remaining_students' => $participationData['remaining_students'],
                    'scheduled_for' => now()->addHours(1), // Schedule for 1 hour from now
                ];
            }
        }

        return [
            'evaluations_checked' => $evaluationsNearingClosure->count(),
            'reminders_scheduled' => count($scheduledReminders),
            'scheduled_reminders' => $scheduledReminders,
            'threshold_used' => $participationThreshold,
            'days_before_closure' => $daysBeforeClosure,
            'scheduled_at' => Carbon::now(),
        ];
    }
}
