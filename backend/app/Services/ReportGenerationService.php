<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Department;
use App\Models\EvaluationSubmission;
use App\Models\Feedback;
use App\Models\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class ReportGenerationService
{
    private EvaluationAnalyticsService $analyticsService;

    public function __construct(EvaluationAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Generate a comprehensive teacher report for a specific evaluation with pagination support.
     * 
     * @param int $evaluationId
     * @param array $options
     * @return array
     */
    public function generateTeacherReport(int $evaluationId, array $options = []): array
    {
        // Use optimized query with specific columns
        $evaluation = Evaluation::select([
                'id', 'teacher_id', 'course_id', 'academic_year', 'semester', 
                'year_level', 'opened_at', 'closed_at'
            ])
            ->with([
                'teacher:id,name,title,email',
                'course:id,title,code,department_id',
                'course.department:id,name'
            ])
            ->findOrFail($evaluationId);
            
        $analytics = $this->analyticsService->generateEvaluationStatistics($evaluationId);
        $participationData = $this->analyticsService->calculateParticipationRate($evaluationId);
        
        // Get question analysis with pagination if requested
        $questionAnalysis = [];
        if (!isset($options['skip_questions']) || !$options['skip_questions']) {
            $questionPage = $options['question_page'] ?? 1;
            $questionPerPage = $options['question_per_page'] ?? 50;
            $paginatedQuestions = $this->getPaginatedQuestionAnalysis($evaluationId, $questionPage, $questionPerPage);
            $questionAnalysis = $paginatedQuestions['data'] ?? [];
        }
        
        return [
            'report_type' => 'teacher_evaluation',
            'generated_at' => Carbon::now(),
            'evaluation_period' => [
                'academic_year' => $evaluation->academic_year,
                'semester' => $evaluation->semester,
                'year_level' => $evaluation->year_level,
                'opened_at' => $evaluation->opened_at,
                'closed_at' => $evaluation->closed_at,
            ],
            'teacher_info' => [
                'id' => $evaluation->teacher->id,
                'name' => $evaluation->teacher->name,
                'title' => $evaluation->teacher->title,
                'email' => $evaluation->teacher->email, // Will be excluded in privacy-preserved exports
            ],
            'course_info' => [
                'id' => $evaluation->course->id,
                'title' => $evaluation->course->title,
                'code' => $evaluation->course->code,
                'department' => $evaluation->course->department->name,
            ],
            'statistics' => [
                'overall_performance_score' => $analytics['performance_score'],
                'average_rating' => $analytics['average_rating'],
                'weighted_scores' => $analytics['weighted_scores'],
                'participation' => $analytics['participation'],
                'rating_distribution' => $analytics['rating_distribution'],
                'total_responses' => $analytics['total_responses'],
                'total_submissions' => $participationData['total_submissions'],
                'last_submission_at' => $participationData['last_submission_at'] ?? null,
            ],
            'question_analysis' => $questionAnalysis,
            'privacy_preserved' => false, // Will be set to true when privacy controls are applied
        ];
    }

    /**
     * Generate a department-wide report with aggregated data and pagination support.
     * 
     * @param int $departmentId
     * @param string $academicYear
     * @param string $semester
     * @param array $options
     * @return array
     */
    public function generateDepartmentReport(int $departmentId, string $academicYear, string $semester, array $options = []): array
    {
        $department = Department::select(['id', 'name'])
            ->with([
                'courses:id,department_id',
                'teachers:id,name'
            ])
            ->findOrFail($departmentId);
        
        // Use optimized query with pagination
        $page = $options['page'] ?? 1;
        $perPage = $options['per_page'] ?? 50;
        
        $evaluationsQuery = Evaluation::select([
                'id', 'teacher_id', 'course_id', 'academic_year', 'semester'
            ])
            ->whereHas('course', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->with([
                'teacher:id,name',
                'course:id,title,code'
            ]);

        // Get paginated results
        $evaluationsPaginated = $evaluationsQuery->paginate($perPage, ['*'], 'page', $page);
        $evaluations = $evaluationsPaginated->items();

        $teacherPerformances = [];
        $departmentStats = [
            'total_evaluations' => $evaluationsPaginated->total(),
            'total_responses' => 0,
            'average_participation_rate' => 0,
            'average_performance_score' => 0,
            'rating_distribution' => [],
        ];

        // Process evaluations in chunks for better memory management
        $evaluationChunks = array_chunk($evaluations, 10);
        
        foreach ($evaluationChunks as $chunk) {
            foreach ($chunk as $evaluation) {
                $analytics = $this->analyticsService->generateEvaluationStatistics($evaluation->id);
                
                $teacherPerformances[] = [
                    'teacher_id' => $evaluation->teacher->id,
                    'teacher_name' => $evaluation->teacher->name,
                    'course_title' => $evaluation->course->title,
                    'course_code' => $evaluation->course->code,
                    'performance_score' => $analytics['performance_score'],
                    'average_rating' => $analytics['average_rating'],
                    'participation_rate' => $analytics['participation']['participation_rate'],
                    'total_responses' => $analytics['total_responses'],
                    'weighted_score' => $analytics['weighted_scores']['weighted_score'],
                ];

                // Aggregate department statistics
                $departmentStats['total_responses'] += $analytics['total_responses'];
                
                // Merge rating distributions
                if (isset($analytics['rating_distribution']) && is_array($analytics['rating_distribution'])) {
                    foreach ($analytics['rating_distribution'] as $rating => $count) {
                        $departmentStats['rating_distribution'][$rating] = 
                            ($departmentStats['rating_distribution'][$rating] ?? 0) + $count;
                    }
                }
            }
        }

        // Calculate department averages
        if (count($teacherPerformances) > 0) {
            $departmentStats['average_participation_rate'] = 
                collect($teacherPerformances)->avg('participation_rate');
            $departmentStats['average_performance_score'] = 
                collect($teacherPerformances)->avg('performance_score');
        }

        // Sort teachers by performance score (descending)
        usort($teacherPerformances, function ($a, $b) {
            return $b['performance_score'] <=> $a['performance_score'];
        });

        return [
            'report_type' => 'department_summary',
            'generated_at' => Carbon::now(),
            'period' => [
                'academic_year' => $academicYear,
                'semester' => $semester,
            ],
            'department_info' => [
                'id' => $department->id,
                'name' => $department->name,
                'total_teachers' => $department->teachers->count(),
                'total_courses' => $department->courses->count(),
            ],
            'department_statistics' => $departmentStats,
            'teacher_performances' => $teacherPerformances,
            'rankings' => [
                'top_performers' => array_slice($teacherPerformances, 0, 5),
                'needs_improvement' => array_slice(array_reverse($teacherPerformances), 0, 5),
            ],
            'pagination' => [
                'current_page' => $evaluationsPaginated->currentPage(),
                'per_page' => $evaluationsPaginated->perPage(),
                'total' => $evaluationsPaginated->total(),
                'last_page' => $evaluationsPaginated->lastPage(),
                'has_more_pages' => $evaluationsPaginated->hasMorePages(),
            ],
            'privacy_preserved' => false,
        ];
    }

    /**
     * Get paginated question analysis for large evaluations.
     * 
     * @param int $evaluationId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    private function getPaginatedQuestionAnalysis(int $evaluationId, int $page = 1, int $perPage = 50): array
    {
        // Use the analytics service method but with pagination
        $allQuestions = $this->analyticsService->generateQuestionAnalysis($evaluationId);
        
        // Apply pagination to the results
        $offset = ($page - 1) * $perPage;
        $paginatedQuestions = array_slice($allQuestions, $offset, $perPage);
        
        return [
            'data' => $paginatedQuestions,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => count($allQuestions),
                'last_page' => ceil(count($allQuestions) / $perPage),
                'has_more_pages' => $offset + $perPage < count($allQuestions),
            ]
        ];
    }

    /**
     * Generate question-by-question analysis for an evaluation with optimized queries.
     * 
     * @param int $evaluationId
     * @return array
     */
    private function generateQuestionAnalysis(int $evaluationId): array
    {
        // Use optimized query with specific columns and eager loading
        $responses = Response::select(['id', 'feedback_id', 'question_id', 'rating'])
            ->whereHas('feedback', function ($query) use ($evaluationId) {
                $query->where('evaluation_id', $evaluationId)
                      ->where('is_locked', true);
            })
            ->with(['question:id,text,type'])
            ->get();

        $questionStats = [];
        
        // Group responses by question for efficient processing
        $responsesByQuestion = $responses->groupBy('question_id');
        
        foreach ($responsesByQuestion as $questionId => $questionResponses) {
            $question = $questionResponses->first()->question;
            $ratings = $questionResponses->whereNotNull('rating')->pluck('rating');
            
            if ($ratings->count() > 0) {
                $questionStats[] = [
                    'question_id' => $questionId,
                    'question_text' => $question->text,
                    'category' => $question->type,
                    'average_rating' => round($ratings->avg(), 2),
                    'total_responses' => $ratings->count(),
                    'rating_distribution' => $ratings->countBy()->toArray(),
                    'performance_percentage' => round(($ratings->avg() / 5) * 100, 2), // Assuming 5-point scale
                ];
            }
        }

        // Sort by average rating (descending)
        usort($questionStats, function ($a, $b) {
            return $b['average_rating'] <=> $a['average_rating'];
        });

        return $questionStats;
    }

    /**
     * Export evaluation data to CSV format with streaming for large datasets.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated CSV file
     */
    public function exportToCSV(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'evaluation_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.csv';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        // Use streaming for large datasets
        if ($this->isLargeDataset($reportData)) {
            $this->streamCSVContent($reportData, $filepath);
        } else {
            $csvContent = $this->generateCSVContent($reportData);
            Storage::put($filepath, $csvContent);
        }
        
        return $filepath;
    }

    /**
     * Check if dataset is large and needs streaming.
     * 
     * @param array $reportData
     * @return bool
     */
    private function isLargeDataset(array $reportData): bool
    {
        $responseCount = $reportData['statistics']['total_responses'] ?? 0;
        $questionCount = count($reportData['question_analysis'] ?? []);
        $teacherCount = count($reportData['teacher_performances'] ?? []);
        
        // Consider large if more than 1000 responses or 100 questions or 50 teachers
        return $responseCount > 1000 || $questionCount > 100 || $teacherCount > 50;
    }

    /**
     * Stream CSV content for large datasets.
     * 
     * @param array $reportData
     * @param string $filepath
     * @return void
     */
    private function streamCSVContent(array $reportData, string $filepath): void
    {
        $stream = Storage::writeStream($filepath);
        
        if (!$stream) {
            throw new \Exception('Unable to create file stream for CSV export');
        }

        // Write header information
        fputcsv($stream, ['Report Type', $reportData['report_type']]);
        fputcsv($stream, ['Generated At', $reportData['generated_at']]);
        fputcsv($stream, ['Privacy Preserved', $reportData['privacy_preserved'] ? 'Yes' : 'No']);
        fputcsv($stream, []); // Empty row

        if ($reportData['report_type'] === 'teacher_evaluation') {
            $this->streamTeacherReportCSV($stream, $reportData);
        } elseif ($reportData['report_type'] === 'department_summary') {
            $this->streamDepartmentReportCSV($stream, $reportData);
        }

        fclose($stream);
    }

    /**
     * Stream teacher report CSV data.
     * 
     * @param resource $stream
     * @param array $reportData
     * @return void
     */
    private function streamTeacherReportCSV($stream, array $reportData): void
    {
        // Teacher information
        fputcsv($stream, ['Teacher Information']);
        fputcsv($stream, ['Name', $reportData['teacher_info']['name']]);
        fputcsv($stream, ['Title', $reportData['teacher_info']['title']]);
        fputcsv($stream, []);

        // Course information
        fputcsv($stream, ['Course Information']);
        fputcsv($stream, ['Course', $reportData['course_info']['title']]);
        fputcsv($stream, ['Code', $reportData['course_info']['code']]);
        fputcsv($stream, ['Department', $reportData['course_info']['department']]);
        fputcsv($stream, []);

        // Statistics
        fputcsv($stream, ['Statistics']);
        fputcsv($stream, ['Overall Performance Score', $reportData['statistics']['overall_performance_score'] . '%']);
        fputcsv($stream, ['Average Rating', $reportData['statistics']['average_rating']]);
        fputcsv($stream, ['Total Responses', $reportData['statistics']['total_responses']]);
        fputcsv($stream, ['Participation Rate', $reportData['statistics']['participation']['participation_rate'] . '%']);
        fputcsv($stream, []);

        // Question analysis (stream in chunks)
        if (isset($reportData['question_analysis']['data'])) {
            fputcsv($stream, ['Question Analysis']);
            fputcsv($stream, ['Question', 'Category', 'Average Rating', 'Total Responses', 'Performance %']);
            
            foreach ($reportData['question_analysis']['data'] as $question) {
                fputcsv($stream, [
                    $question['question_text'],
                    $question['category'],
                    $question['average_rating'],
                    $question['total_responses'],
                    $question['performance_percentage'] . '%'
                ]);
            }
        }
    }

    /**
     * Stream department report CSV data.
     * 
     * @param resource $stream
     * @param array $reportData
     * @return void
     */
    private function streamDepartmentReportCSV($stream, array $reportData): void
    {
        // Department information
        fputcsv($stream, ['Department Information']);
        fputcsv($stream, ['Department', $reportData['department_info']['name']]);
        fputcsv($stream, ['Total Teachers', $reportData['department_info']['total_teachers']]);
        fputcsv($stream, ['Total Courses', $reportData['department_info']['total_courses']]);
        fputcsv($stream, []);

        // Teacher performances (stream in chunks)
        fputcsv($stream, ['Teacher Performances']);
        fputcsv($stream, ['Teacher', 'Course', 'Performance Score', 'Average Rating', 'Participation Rate', 'Total Responses']);
        
        foreach ($reportData['teacher_performances'] as $performance) {
            fputcsv($stream, [
                $performance['teacher_name'],
                $performance['course_title'],
                $performance['performance_score'] . '%',
                $performance['average_rating'],
                $performance['participation_rate'] . '%',
                $performance['total_responses']
            ]);
        }
    }

    /**
     * Export evaluation data to PDF format.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated PDF file
     */
    public function exportToPDF(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'evaluation_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.pdf';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        $htmlContent = $this->generateHTMLContent($reportData);
        
        // For now, we'll save as HTML until PDF library is properly installed
        // This would be replaced with actual PDF generation using DomPDF
        Storage::put(str_replace('.pdf', '.html', $filepath), $htmlContent);
        
        return str_replace('.pdf', '.html', $filepath);
    }

    /**
     * Export evaluation data to Excel format.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated Excel file
     */
    public function exportToExcel(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'evaluation_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.xlsx';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        // For now, we'll export as CSV until Excel library is properly installed
        // This would be replaced with actual Excel generation using Maatwebsite/Excel
        $csvContent = $this->generateCSVContent($reportData);
        Storage::put(str_replace('.xlsx', '.csv', $filepath), $csvContent);
        
        return str_replace('.xlsx', '.csv', $filepath);
    }

    /**
     * Apply privacy controls to report data.
     * 
     * @param array $reportData
     * @return array
     */
    private function applyPrivacyControls(array $reportData): array
    {
        // Remove or anonymize sensitive information
        $reportData['privacy_preserved'] = true;
        
        // Remove teacher email if present
        if (isset($reportData['teacher_info']['email'])) {
            unset($reportData['teacher_info']['email']);
        }
        
        // For department reports, we might want to anonymize teacher names
        if ($reportData['report_type'] === 'department_summary') {
            // Check if teacher_performances exists and is iterable
            if (isset($reportData['teacher_performances']) && is_array($reportData['teacher_performances'])) {
                foreach ($reportData['teacher_performances'] as &$performance) {
                    // Replace teacher name with anonymous identifier
                    $performance['teacher_name'] = 'Teacher ' . substr(md5($performance['teacher_name']), 0, 6);
                }
            }
            
            // Apply same anonymization to rankings if they exist
            if (isset($reportData['rankings']['top_performers']) && is_array($reportData['rankings']['top_performers'])) {
                foreach ($reportData['rankings']['top_performers'] as &$performer) {
                    $performer['teacher_name'] = 'Teacher ' . substr(md5($performer['teacher_name']), 0, 6);
                }
            }
            if (isset($reportData['rankings']['needs_improvement']) && is_array($reportData['rankings']['needs_improvement'])) {
                foreach ($reportData['rankings']['needs_improvement'] as &$performer) {
                    $performer['teacher_name'] = 'Teacher ' . substr(md5($performer['teacher_name']), 0, 6);
                }
            }
        }
        
        return $reportData;
    }

    /**
     * Generate CSV content from report data.
     * 
     * @param array $reportData
     * @return string
     */
    private function generateCSVContent(array $reportData): string
    {
        $csv = [];
        
        // Add header information
        $csv[] = ['Report Type', $reportData['report_type']];
        $csv[] = ['Generated At', $reportData['generated_at']];
        $csv[] = ['Privacy Preserved', $reportData['privacy_preserved'] ? 'Yes' : 'No'];
        $csv[] = []; // Empty row
        
        if ($reportData['report_type'] === 'teacher_evaluation') {
            // Teacher report CSV format
            $csv[] = ['Teacher Information'];
            $csv[] = ['Name', $reportData['teacher_info']['name']];
            $csv[] = ['Title', $reportData['teacher_info']['title']];
            $csv[] = [];
            
            $csv[] = ['Course Information'];
            $csv[] = ['Course', $reportData['course_info']['title']];
            $csv[] = ['Code', $reportData['course_info']['code']];
            $csv[] = ['Department', $reportData['course_info']['department']];
            $csv[] = [];
            
            $csv[] = ['Statistics'];
            $csv[] = ['Overall Performance Score', $reportData['statistics']['overall_performance_score'] . '%'];
            $csv[] = ['Average Rating', $reportData['statistics']['average_rating']];
            $csv[] = ['Total Responses', $reportData['statistics']['total_responses']];
            $csv[] = ['Participation Rate', $reportData['statistics']['participation']['participation_rate'] . '%'];
            $csv[] = [];
            
            // Question analysis
            $csv[] = ['Question Analysis'];
            $csv[] = ['Question', 'Category', 'Average Rating', 'Total Responses', 'Performance %'];
            
            // Handle both direct array and paginated structure
            $questions = $reportData['question_analysis'];
            if (isset($questions['data'])) {
                $questions = $questions['data'];
            }
            
            foreach ($questions as $question) {
                $csv[] = [
                    $question['question_text'] ?? 'N/A',
                    $question['category'] ?? 'General',
                    $question['average_rating'] ?? 0,
                    $question['total_responses'] ?? 0,
                    ($question['performance_percentage'] ?? 0) . '%'
                ];
            }
        } elseif ($reportData['report_type'] === 'department_summary') {
            // Department report CSV format
            $csv[] = ['Department Information'];
            $csv[] = ['Department', $reportData['department_info']['name']];
            $csv[] = ['Total Teachers', $reportData['department_info']['total_teachers']];
            $csv[] = ['Total Courses', $reportData['department_info']['total_courses']];
            $csv[] = [];
            
            $csv[] = ['Teacher Performances'];
            $csv[] = ['Teacher', 'Course', 'Performance Score', 'Average Rating', 'Participation Rate', 'Total Responses'];
            foreach ($reportData['teacher_performances'] as $performance) {
                $csv[] = [
                    $performance['teacher_name'],
                    $performance['course_title'],
                    $performance['performance_score'] . '%',
                    $performance['average_rating'],
                    $performance['participation_rate'] . '%',
                    $performance['total_responses']
                ];
            }
        }
        
        // Convert array to CSV string
        $output = '';
        foreach ($csv as $row) {
            $output .= implode(',', array_map(function($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }
        
        return $output;
    }

    /**
     * Generate HTML content for PDF reports.
     * 
     * @param array $reportData
     * @return string
     */
    private function generateHTMLContent(array $reportData): string
    {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Evaluation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f8f9fa; }
        .stats { display: flex; flex-wrap: wrap; gap: 20px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 200px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .chart-placeholder { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
    </style>
</head>
<body>';

        $html .= '<div class="header">';
        $html .= '<h1>Evaluation Report</h1>';
        $html .= '<p>Generated on: ' . $reportData['generated_at'] . '</p>';
        $html .= '<p>Privacy Preserved: ' . ($reportData['privacy_preserved'] ? 'Yes' : 'No') . '</p>';
        $html .= '</div>';

        if ($reportData['report_type'] === 'teacher_evaluation') {
            // Teacher report HTML
            $html .= '<div class="section">';
            $html .= '<h2>Teacher Information</h2>';
            $html .= '<table class="info-table">';
            $html .= '<tr><th>Name</th><td>' . $reportData['teacher_info']['name'] . '</td></tr>';
            $html .= '<tr><th>Title</th><td>' . $reportData['teacher_info']['title'] . '</td></tr>';
            $html .= '</table>';
            $html .= '</div>';

            $html .= '<div class="section">';
            $html .= '<h2>Course Information</h2>';
            $html .= '<table class="info-table">';
            $html .= '<tr><th>Course</th><td>' . $reportData['course_info']['title'] . '</td></tr>';
            $html .= '<tr><th>Code</th><td>' . $reportData['course_info']['code'] . '</td></tr>';
            $html .= '<tr><th>Department</th><td>' . $reportData['course_info']['department'] . '</td></tr>';
            $html .= '</table>';
            $html .= '</div>';

            $html .= '<div class="section">';
            $html .= '<h2>Performance Statistics</h2>';
            $html .= '<div class="stats">';
            $html .= '<div class="stat-card"><div class="stat-value">' . $reportData['statistics']['overall_performance_score'] . '%</div><div>Overall Performance</div></div>';
            $html .= '<div class="stat-card"><div class="stat-value">' . $reportData['statistics']['average_rating'] . '</div><div>Average Rating</div></div>';
            $html .= '<div class="stat-card"><div class="stat-value">' . $reportData['statistics']['total_responses'] . '</div><div>Total Responses</div></div>';
            $html .= '<div class="stat-card"><div class="stat-value">' . $reportData['statistics']['participation']['participation_rate'] . '%</div><div>Participation Rate</div></div>';
            $html .= '</div>';
            $html .= '</div>';

            // Chart placeholder
            $html .= '<div class="section">';
            $html .= '<h2>Performance Visualization</h2>';
            $html .= '<div class="chart-placeholder">Chart showing rating distribution and trends would appear here</div>';
            $html .= '</div>';
        }

        $html .= '</body></html>';
        
        return $html;
    }

    /**
     * Get available export formats.
     * 
     * @return array
     */
    public function getAvailableFormats(): array
    {
        return [
            'csv' => [
                'name' => 'CSV',
                'description' => 'Comma-separated values format',
                'extension' => '.csv',
                'mime_type' => 'text/csv',
            ],
            'pdf' => [
                'name' => 'PDF',
                'description' => 'Portable Document Format with charts',
                'extension' => '.pdf',
                'mime_type' => 'application/pdf',
            ],
            'excel' => [
                'name' => 'Excel',
                'description' => 'Microsoft Excel format with multiple sheets',
                'extension' => '.xlsx',
                'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
        ];
    }

    /**
     * Validate report data completeness before export.
     * 
     * @param array $reportData
     * @return bool
     */
    public function validateReportCompleteness(array $reportData): bool
    {
        try {
            // Check required fields based on report type
            if ($reportData['report_type'] === 'teacher_evaluation') {
                $requiredFields = [
                    'teacher_info.name',
                    'course_info.title',
                    'statistics.overall_performance_score',
                    'statistics.total_responses'
                ];
            } elseif ($reportData['report_type'] === 'department_summary') {
                $requiredFields = [
                    'department_info.name',
                    'department_statistics.total_evaluations',
                    'teacher_performances'
                ];
            } else {
                return false;
            }

            foreach ($requiredFields as $field) {
                if (!$this->hasNestedValue($reportData, $field)) {
                    \Log::warning('Report validation failed: missing field', ['field' => $field]);
                    return false;
                }
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error validating report completeness', [
                'error' => $e->getMessage(),
                'report_type' => $reportData['report_type'] ?? 'unknown'
            ]);
            return false;
        }
    }

    /**
     * Get missing components from report data.
     * 
     * @param array $reportData
     * @return array
     */
    public function getMissingComponents(array $reportData): array
    {
        $missing = [];
        
        try {
            if ($reportData['report_type'] === 'teacher_evaluation') {
                $requiredFields = [
                    'teacher_info.name' => 'Teacher name',
                    'course_info.title' => 'Course title',
                    'statistics.overall_performance_score' => 'Performance score',
                    'statistics.total_responses' => 'Response count'
                ];
            } elseif ($reportData['report_type'] === 'department_summary') {
                $requiredFields = [
                    'department_info.name' => 'Department name',
                    'department_statistics.total_evaluations' => 'Evaluation count',
                    'teacher_performances' => 'Teacher performance data'
                ];
            } else {
                return ['Invalid report type'];
            }

            foreach ($requiredFields as $field => $description) {
                if (!$this->hasNestedValue($reportData, $field)) {
                    $missing[] = $description;
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error checking missing components', [
                'error' => $e->getMessage()
            ]);
            $missing[] = 'Unable to validate report structure';
        }

        return $missing;
    }

    /**
     * Check if nested value exists in array.
     * 
     * @param array $array
     * @param string $path
     * @return bool
     */
    private function hasNestedValue(array $array, string $path): bool
    {
        $keys = explode('.', $path);
        $current = $array;

        foreach ($keys as $key) {
            if (!is_array($current) || !array_key_exists($key, $current)) {
                return false;
            }
            $current = $current[$key];
        }

        return $current !== null && $current !== '';
    }

    /**
     * Handle export errors with detailed logging and recovery.
     * 
     * @param \Exception $exception
     * @param string $format
     * @param array $reportData
     * @return array
     */
    public function handleExportError(\Exception $exception, string $format, array $reportData): array
    {
        $errorContext = [
            'format' => $format,
            'report_type' => $reportData['report_type'] ?? 'unknown',
            'error_message' => $exception->getMessage(),
            'error_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine()
        ];

        \Log::error('Export generation failed', $errorContext);

        // Determine error type and provide specific guidance
        $errorType = $this->categorizeExportError($exception);
        
        return [
            'success' => false,
            'error_type' => $errorType,
            'error_message' => $this->getErrorMessage($errorType, $format),
            'suggested_actions' => $this->getSuggestedActions($errorType, $format),
            'retry_recommended' => $this->isRetryRecommended($errorType),
            'alternative_formats' => $this->getAlternativeFormats($format),
            'technical_details' => app()->environment('local') ? $exception->getMessage() : null
        ];
    }

    /**
     * Categorize export errors for better handling.
     * 
     * @param \Exception $exception
     * @return string
     */
    private function categorizeExportError(\Exception $exception): string
    {
        $message = strtolower($exception->getMessage());
        
        if (str_contains($message, 'memory') || str_contains($message, 'memory_limit')) {
            return 'memory_limit';
        }
        
        if (str_contains($message, 'timeout') || str_contains($message, 'time_limit')) {
            return 'timeout';
        }
        
        if (str_contains($message, 'disk') || str_contains($message, 'storage')) {
            return 'storage_error';
        }
        
        if (str_contains($message, 'permission') || str_contains($message, 'access')) {
            return 'permission_error';
        }
        
        if (str_contains($message, 'format') || str_contains($message, 'invalid')) {
            return 'format_error';
        }
        
        return 'unknown_error';
    }

    /**
     * Get user-friendly error message based on error type.
     * 
     * @param string $errorType
     * @param string $format
     * @return string
     */
    private function getErrorMessage(string $errorType, string $format): string
    {
        $messages = [
            'memory_limit' => "The {$format} export requires more memory than available. The dataset may be too large.",
            'timeout' => "The {$format} export is taking too long to generate. This usually happens with large datasets.",
            'storage_error' => "Unable to save the {$format} file due to storage issues. The disk may be full.",
            'permission_error' => "Permission denied while creating the {$format} file. Please contact your administrator.",
            'format_error' => "There was an error formatting the data for {$format} export. The data may be corrupted.",
            'unknown_error' => "An unexpected error occurred while generating the {$format} export."
        ];

        return $messages[$errorType] ?? $messages['unknown_error'];
    }

    /**
     * Get suggested actions for error recovery.
     * 
     * @param string $errorType
     * @param string $format
     * @return array
     */
    private function getSuggestedActions(string $errorType, string $format): array
    {
        $actions = [
            'memory_limit' => [
                'Try exporting a smaller date range',
                'Use CSV format instead of PDF or Excel',
                'Filter the data to include fewer evaluations',
                'Contact support if the problem persists'
            ],
            'timeout' => [
                'Try again during off-peak hours',
                'Export smaller chunks of data',
                'Use a simpler format like CSV',
                'Contact support for large dataset exports'
            ],
            'storage_error' => [
                'Try again in a few minutes',
                'Contact your administrator about disk space',
                'Clear old report files if possible'
            ],
            'permission_error' => [
                'Contact your system administrator',
                'Check if you have the necessary permissions',
                'Try logging out and back in'
            ],
            'format_error' => [
                'Try a different export format',
                'Check if the evaluation data is complete',
                'Contact support with the error details'
            ],
            'unknown_error' => [
                'Try again in a few minutes',
                'Try a different export format',
                'Contact support if the problem continues'
            ]
        ];

        return $actions[$errorType] ?? $actions['unknown_error'];
    }

    /**
     * Check if retry is recommended for the error type.
     * 
     * @param string $errorType
     * @return bool
     */
    private function isRetryRecommended(string $errorType): bool
    {
        $retryableErrors = ['timeout', 'storage_error', 'unknown_error'];
        return in_array($errorType, $retryableErrors);
    }

    /**
     * Get alternative export formats when one fails.
     * 
     * @param string $failedFormat
     * @return array
     */
    private function getAlternativeFormats(string $failedFormat): array
    {
        $alternatives = [
            'pdf' => ['csv', 'excel'],
            'excel' => ['csv', 'pdf'],
            'csv' => ['excel']
        ];

        return $alternatives[$failedFormat] ?? ['csv'];
    }

    /**
     * Estimate export processing time based on data size.
     * 
     * @param array $reportData
     * @param string $format
     * @return int Estimated seconds
     */
    public function estimateProcessingTime(array $reportData, string $format): int
    {
        $baseTime = 2; // Base processing time in seconds
        
        // Calculate complexity factors
        $responseCount = $reportData['statistics']['total_responses'] ?? 0;
        $questionCount = count($reportData['question_analysis'] ?? []);
        
        // Format-specific multipliers
        $formatMultipliers = [
            'csv' => 1.0,
            'excel' => 2.5,
            'pdf' => 4.0
        ];
        
        $multiplier = $formatMultipliers[$format] ?? 1.0;
        
        // Estimate based on data size
        $dataComplexity = ($responseCount * 0.01) + ($questionCount * 0.5);
        
        return max($baseTime, (int)($baseTime + $dataComplexity * $multiplier));
    }

    /**
     * Check system resources before export.
     * 
     * @return array
     */
    public function checkSystemResources(): array
    {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);
        
        // Convert memory limit to bytes
        $memoryLimitBytes = $this->convertToBytes($memoryLimit);
        $memoryAvailable = $memoryLimitBytes - $memoryUsage;
        
        // Check disk space
        $diskFree = disk_free_space(storage_path('app'));
        $diskTotal = disk_total_space(storage_path('app'));
        
        return [
            'memory' => [
                'limit' => $memoryLimit,
                'used' => $this->formatBytes($memoryUsage),
                'peak' => $this->formatBytes($memoryPeak),
                'available' => $this->formatBytes($memoryAvailable),
                'usage_percentage' => round(($memoryUsage / $memoryLimitBytes) * 100, 2)
            ],
            'disk' => [
                'free' => $this->formatBytes($diskFree),
                'total' => $this->formatBytes($diskTotal),
                'usage_percentage' => round((($diskTotal - $diskFree) / $diskTotal) * 100, 2)
            ],
            'recommendations' => $this->getResourceRecommendations($memoryUsage, $memoryLimitBytes, $diskFree)
        ];
    }

    /**
     * Convert memory limit string to bytes.
     * 
     * @param string $val
     * @return int
     */
    private function convertToBytes(string $val): int
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        $val = (int)$val;
        
        switch($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }
        
        return $val;
    }

    /**
     * Format bytes to human readable format.
     * 
     * @param int $bytes
     * @return string
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Get resource usage recommendations.
     * 
     * @param int $memoryUsage
     * @param int $memoryLimit
     * @param int $diskFree
     * @return array
     */
    private function getResourceRecommendations(int $memoryUsage, int $memoryLimit, int $diskFree): array
    {
        $recommendations = [];
        
        $memoryUsagePercent = ($memoryUsage / $memoryLimit) * 100;
        
        if ($memoryUsagePercent > 80) {
            $recommendations[] = 'High memory usage detected. Consider exporting smaller datasets or using CSV format.';
        }
        
        if ($diskFree < 100 * 1024 * 1024) { // Less than 100MB
            $recommendations[] = 'Low disk space available. Clean up old report files or contact administrator.';
        }
        
        if (empty($recommendations)) {
            $recommendations[] = 'System resources are adequate for export operations.';
        }
        
        return $recommendations;
    }



    /**
     * Optimize report generation for large datasets.
     * 
     * @param array $reportData
     * @return array
     */
    public function optimizeReportData(array $reportData): array
    {
        // Remove unnecessary data for large datasets
        if ($this->isLargeDataset($reportData)) {
            // Limit question analysis to top 50 questions
            if (isset($reportData['question_analysis']) && is_array($reportData['question_analysis'])) {
                $reportData['question_analysis'] = array_slice($reportData['question_analysis'], 0, 50);
            }
            
            // Limit teacher performances to top 100 teachers
            if (isset($reportData['teacher_performances']) && is_array($reportData['teacher_performances'])) {
                $reportData['teacher_performances'] = array_slice($reportData['teacher_performances'], 0, 100);
            }
            
            // Add optimization notice
            $reportData['optimization_applied'] = true;
            $reportData['optimization_note'] = 'Data has been limited for performance optimization';
        }
        
        return $reportData;
    }

    /**
     * Pre-process report data for faster exports.
     * 
     * @param array $reportData
     * @return array
     */
    public function preprocessReportData(array $reportData): array
    {
        // Pre-calculate commonly used values
        if (isset($reportData['statistics'])) {
            $reportData['statistics']['performance_grade'] = $this->calculatePerformanceGrade(
                $reportData['statistics']['overall_performance_score'] ?? 0
            );
        }
        
        // Pre-format percentages
        if (isset($reportData['teacher_performances'])) {
            foreach ($reportData['teacher_performances'] as &$performance) {
                $performance['performance_score_formatted'] = number_format($performance['performance_score'], 1) . '%';
                $performance['participation_rate_formatted'] = number_format($performance['participation_rate'], 1) . '%';
            }
        }
        
        // Add summary statistics
        if (isset($reportData['question_analysis']) && is_array($reportData['question_analysis'])) {
            $ratings = array_column($reportData['question_analysis'], 'average_rating');
            if (!empty($ratings)) {
                $reportData['question_summary'] = [
                    'total_questions' => count($reportData['question_analysis']),
                    'highest_rated' => max($ratings),
                    'lowest_rated' => min($ratings),
                    'average_across_questions' => round(array_sum($ratings) / count($ratings), 2)
                ];
            }
        }
        
        return $reportData;
    }

    /**
     * Calculate performance grade based on score.
     * 
     * @param float $score
     * @return string
     */
    private function calculatePerformanceGrade(float $score): string
    {
        return match(true) {
            $score >= 90 => 'Excellent',
            $score >= 80 => 'Good',
            $score >= 70 => 'Satisfactory',
            $score >= 60 => 'Needs Improvement',
            default => 'Poor'
        };
    }

    /**
     * Get memory-efficient report summary.
     * 
     * @param array $reportData
     * @return array
     */
    public function getReportSummary(array $reportData): array
    {
        $summary = [
            'report_type' => $reportData['report_type'],
            'generated_at' => $reportData['generated_at'],
            'data_size' => $this->calculateDataSize($reportData),
        ];

        if ($reportData['report_type'] === 'teacher_evaluation') {
            $summary['teacher_name'] = $reportData['teacher_info']['name'] ?? 'Unknown';
            $summary['course_code'] = $reportData['course_info']['code'] ?? 'N/A';
            $summary['performance_score'] = $reportData['statistics']['overall_performance_score'] ?? 0;
            $summary['total_responses'] = $reportData['statistics']['total_responses'] ?? 0;
        } elseif ($reportData['report_type'] === 'department_summary') {
            $summary['department_name'] = $reportData['department_info']['name'] ?? 'Unknown';
            $summary['total_evaluations'] = $reportData['department_statistics']['total_evaluations'] ?? 0;
            $summary['average_performance'] = $reportData['department_statistics']['average_performance_score'] ?? 0;
            $summary['total_teachers'] = count($reportData['teacher_performances'] ?? []);
        }

        return $summary;
    }

    /**
     * Calculate approximate data size.
     * 
     * @param array $data
     * @return string
     */
    private function calculateDataSize(array $data): string
    {
        $serialized = serialize($data);
        $bytes = strlen($serialized);
        
        if ($bytes >= 1024 * 1024) {
            return round($bytes / (1024 * 1024), 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Clean up old report files to free disk space.
     * 
     * @param int $daysOld
     * @return array
     */
    public function cleanupOldReports(int $daysOld = 30): array
    {
        $reportsPath = 'reports/';
        $cutoffDate = Carbon::now()->subDays($daysOld);
        
        $files = Storage::files($reportsPath);
        $deletedFiles = [];
        $totalSize = 0;
        
        foreach ($files as $file) {
            $lastModified = Carbon::createFromTimestamp(Storage::lastModified($file));
            
            if ($lastModified->lt($cutoffDate)) {
                $size = Storage::size($file);
                $totalSize += $size;
                
                if (Storage::delete($file)) {
                    $deletedFiles[] = [
                        'file' => $file,
                        'size' => $this->formatBytes($size),
                        'last_modified' => $lastModified->toDateTimeString()
                    ];
                }
            }
        }
        
        return [
            'deleted_count' => count($deletedFiles),
            'total_size_freed' => $this->formatBytes($totalSize),
            'deleted_files' => $deletedFiles
        ];
    }

    /**
     * Export department evaluation data to CSV format.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated CSV file
     */
    public function exportDepartmentToCSV(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'department_' . ($reportData['department']->id ?? 'unknown') . '_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.csv';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        $csvContent = $this->generateDepartmentCSVContent($reportData);
        Storage::put($filepath, $csvContent);
        
        return $filepath;
    }

    /**
     * Export department evaluation data to PDF format.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated PDF file
     */
    public function exportDepartmentToPDF(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'department_' . ($reportData['department']->id ?? 'unknown') . '_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.pdf';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        $htmlContent = $this->generateDepartmentHTMLContent($reportData);
        
        // For now, we'll save as HTML until PDF library is properly installed
        Storage::put(str_replace('.pdf', '.html', $filepath), $htmlContent);
        
        return str_replace('.pdf', '.html', $filepath);
    }

    /**
     * Export department evaluation data to Excel format.
     * 
     * @param array $reportData
     * @param bool $preservePrivacy
     * @return string Path to the generated Excel file
     */
    public function exportDepartmentToExcel(array $reportData, bool $preservePrivacy = true): string
    {
        $filename = 'department_' . ($reportData['department']->id ?? 'unknown') . '_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.xlsx';
        $filepath = 'reports/' . $filename;
        
        // Apply privacy controls if needed
        if ($preservePrivacy) {
            $reportData = $this->applyPrivacyControls($reportData);
        }

        // For now, we'll export as CSV until Excel library is properly installed
        $csvContent = $this->generateDepartmentCSVContent($reportData);
        Storage::put(str_replace('.xlsx', '.csv', $filepath), $csvContent);
        
        return str_replace('.xlsx', '.csv', $filepath);
    }

    /**
     * Generate CSV content for department report.
     * 
     * @param array $reportData
     * @return string
     */
    private function generateDepartmentCSVContent(array $reportData): string
    {
        $csv = [];
        
        // Add header information
        $csv[] = ['Department Evaluation Report'];
        $csv[] = ['Generated At', $reportData['export_timestamp']];
        $csv[] = ['Department', $reportData['department']->name ?? 'Unknown'];
        $csv[] = ['Privacy Preserved', isset($reportData['privacy_preserved']) && $reportData['privacy_preserved'] ? 'Yes' : 'No'];
        $csv[] = []; // Empty row
        
        // Summary statistics
        $csv[] = ['Summary Statistics'];
        $csv[] = ['Total Evaluations', $reportData['summary']['total_evaluations'] ?? 0];
        $csv[] = ['Active Evaluations', $reportData['summary']['active_evaluations'] ?? 0];
        $csv[] = ['Closed Evaluations', $reportData['summary']['closed_evaluations'] ?? 0];
        $csv[] = ['Total Responses', $reportData['summary']['total_responses'] ?? 0];
        $csv[] = ['Average Participation Rate', number_format($reportData['summary']['average_participation'] ?? 0, 1) . '%'];
        $csv[] = []; // Empty row
        
        // Filters applied
        if (!empty($reportData['filters_applied']) && is_array($reportData['filters_applied'])) {
            $csv[] = ['Filters Applied'];
            foreach ($reportData['filters_applied'] as $filter => $value) {
                if (!empty($value)) {
                    $csv[] = [ucfirst($filter), $value];
                }
            }
            $csv[] = []; // Empty row
        }
        
        // Evaluation details
        $csv[] = ['Evaluation Details'];
        $csv[] = [
            'Evaluation ID',
            'Course Title',
            'Course Code',
            'Instructor Name',
            'Year Level',
            'Status',
            'Opened Date',
            'Closed Date',
            'Total Responses',
            'Participation Rate (%)',
            'Data Quality'
        ];
        
        // Check if evaluations exist and is iterable
        if (isset($reportData['evaluations']) && is_iterable($reportData['evaluations'])) {
            foreach ($reportData['evaluations'] as $evaluation) {
                // Ensure evaluation has required relationships loaded
                if (!$evaluation->relationLoaded('course')) {
                    $evaluation->load('course');
                }
                if (!$evaluation->relationLoaded('teacher')) {
                    $evaluation->load('teacher');
                }
                if (!$evaluation->relationLoaded('feedbacks')) {
                    $evaluation->load('feedbacks');
                }
                if (!$evaluation->relationLoaded('analytics')) {
                    $evaluation->load('analytics');
                }
                
                $csv[] = [
                    $evaluation->id,
                    $evaluation->course->title ?? 'N/A',
                    $evaluation->course->code ?? 'N/A',
                    $evaluation->teacher->name ?? 'N/A',
                    $evaluation->course->year_level ?? 'N/A',
                    $evaluation->status ?? 'N/A',
                    $evaluation->opened_at ? Carbon::parse($evaluation->opened_at)->format('Y-m-d') : 'N/A',
                    $evaluation->closed_at ? Carbon::parse($evaluation->closed_at)->format('Y-m-d') : 'N/A',
                    $evaluation->feedbacks->count(),
                    $evaluation->analytics ? number_format($evaluation->analytics->participation_rate, 1) : '0.0',
                    $this->getDataQuality($evaluation->analytics ? $evaluation->analytics->participation_rate : 0)
                ];
            }
        } else {
            $csv[] = ['No evaluations found'];
        }
        
        // Convert array to CSV string
        $output = '';
        foreach ($csv as $row) {
            $output .= implode(',', array_map(function($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }
        
        return $output;
    }

    /**
     * Generate HTML content for department PDF reports.
     * 
     * @param array $reportData
     * @return string
     */
    private function generateDepartmentHTMLContent(array $reportData): string
    {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Department Evaluation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f8f9fa; }
        .stats { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 150px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .evaluation-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .evaluation-table th, .evaluation-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        .evaluation-table th { background-color: #f8f9fa; }
        .status-active { color: #28a745; font-weight: bold; }
        .status-closed { color: #6c757d; }
        .participation-high { color: #28a745; }
        .participation-medium { color: #ffc107; }
        .participation-low { color: #dc3545; }
    </style>
</head>
<body>';

        $html .= '<div class="header">';
        $html .= '<h1>Department Evaluation Report</h1>';
        $html .= '<h2>' . ($reportData['department']->name ?? 'Unknown Department') . '</h2>';
        $html .= '<p>Generated on: ' . $reportData['export_timestamp'] . '</p>';
        $html .= '<p>Privacy Preserved: ' . (isset($reportData['privacy_preserved']) && $reportData['privacy_preserved'] ? 'Yes' : 'No') . '</p>';
        $html .= '</div>';

        // Summary statistics
        $html .= '<div class="section">';
        $html .= '<h2>Summary Statistics</h2>';
        $html .= '<div class="stats">';
        $html .= '<div class="stat-card"><div class="stat-value">' . ($reportData['summary']['total_evaluations'] ?? 0) . '</div><div>Total Evaluations</div></div>';
        $html .= '<div class="stat-card"><div class="stat-value">' . ($reportData['summary']['active_evaluations'] ?? 0) . '</div><div>Active Evaluations</div></div>';
        $html .= '<div class="stat-card"><div class="stat-value">' . ($reportData['summary']['closed_evaluations'] ?? 0) . '</div><div>Closed Evaluations</div></div>';
        $html .= '<div class="stat-card"><div class="stat-value">' . ($reportData['summary']['total_responses'] ?? 0) . '</div><div>Total Responses</div></div>';
        $html .= '<div class="stat-card"><div class="stat-value">' . number_format($reportData['summary']['average_participation'] ?? 0, 1) . '%</div><div>Avg Participation</div></div>';
        $html .= '</div>';
        $html .= '</div>';

        // Evaluation details table
        $html .= '<div class="section">';
        $html .= '<h2>Evaluation Details</h2>';
        $html .= '<table class="evaluation-table">';
        $html .= '<thead><tr>';
        $html .= '<th>Course</th><th>Instructor</th><th>Year</th><th>Status</th><th>Opened</th><th>Responses</th><th>Participation</th><th>Quality</th>';
        $html .= '</tr></thead>';
        $html .= '<tbody>';
        
        if (isset($reportData['evaluations']) && is_iterable($reportData['evaluations'])) {
            foreach ($reportData['evaluations'] as $evaluation) {
                $participationRate = $evaluation->analytics ? $evaluation->analytics->participation_rate : 0;
                $participationClass = $participationRate >= 80 ? 'participation-high' : 
                                     ($participationRate >= 60 ? 'participation-medium' : 'participation-low');
                $statusClass = $evaluation->status === 'Active' ? 'status-active' : 'status-closed';
                
                $html .= '<tr>';
                $html .= '<td>' . ($evaluation->course->title ?? 'N/A') . '<br><small>' . ($evaluation->course->code ?? '') . '</small></td>';
                $html .= '<td>' . ($evaluation->teacher->name ?? 'N/A') . '</td>';
                $html .= '<td>' . ($evaluation->course->year_level ?? 'N/A') . '</td>';
                $html .= '<td><span class="' . $statusClass . '">' . ($evaluation->status ?? 'N/A') . '</span></td>';
                $html .= '<td>' . ($evaluation->opened_at ? Carbon::parse($evaluation->opened_at)->format('M d, Y') : 'N/A') . '</td>';
                $html .= '<td>' . $evaluation->feedbacks->count() . '</td>';
                $html .= '<td><span class="' . $participationClass . '">' . number_format($participationRate, 1) . '%</span></td>';
                $html .= '<td>' . $this->getDataQuality($participationRate) . '</td>';
                $html .= '</tr>';
            }
        } else {
            $html .= '<tr><td colspan="8">No evaluations found</td></tr>';
        }
        
        $html .= '</tbody></table>';
        $html .= '</div>';

        $html .= '</body></html>';
        
        return $html;
    }

    /**
     * Get data quality assessment based on participation rate.
     * 
     * @param float $participationRate
     * @return string
     */
    private function getDataQuality(float $participationRate): string
    {
        if ($participationRate >= 80) return 'Excellent';
        if ($participationRate >= 60) return 'Good';
        return 'Limited';
    }
}