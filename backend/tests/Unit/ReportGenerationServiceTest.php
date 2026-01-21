<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ReportGenerationService;
use App\Services\EvaluationAnalyticsService;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Department;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\Feedback;
use App\Models\Response;
use App\Models\Question;
use App\Models\EvaluationSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Faker\Factory as Faker;

class ReportGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReportGenerationService $service;
    private EvaluationAnalyticsService $analyticsService;
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->analyticsService = new EvaluationAnalyticsService();
        $this->service = new ReportGenerationService($this->analyticsService);
        $this->faker = Faker::create();
        
        // Set up storage for testing
        Storage::fake('local');
    }

    /**
     * **Feature: evaluation-submission-control, Property 10: Report Content Completeness**
     * For any generated report, it should include teacher information, course details, 
     * evaluation period, and comprehensive statistics
     * **Validates: Requirements 3.1**
     */
    public function test_report_content_completeness_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Create random number of students and responses
            $numStudents = $this->faker->numberBetween(3, 15);
            $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
            
            // Create questions
            $questions = Question::factory()->count(3)->create();
            
            foreach ($students as $student) {
                // Create submission
                $submission = EvaluationSubmission::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'submitted_at' => now(),
                    'is_anonymous' => true,
                    'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                ]);
                
                // Create feedback
                $feedback = Feedback::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'anonymous' => true,
                    'submission_id' => $submission->id,
                    'is_locked' => true,
                ]);
                
                // Create responses for each question
                foreach ($questions as $question) {
                    $rating = $this->faker->numberBetween(1, 5);
                    Response::create([
                        'feedback_id' => $feedback->id,
                        'question_id' => $question->id,
                        'rating' => $rating,
                        'text' => $this->faker->sentence(),
                    ]);
                }
            }
            
            // Generate teacher report
            $reportData = $this->service->generateTeacherReport($evaluation->id);
            
            // Property: Report should contain all required teacher information
            $this->assertArrayHasKey('teacher_info', $reportData, 
                "Report should contain teacher_info for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('id', $reportData['teacher_info'], 
                "Teacher info should contain id for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('name', $reportData['teacher_info'], 
                "Teacher info should contain name for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('title', $reportData['teacher_info'], 
                "Teacher info should contain title for evaluation {$evaluation->id}");
            
            // Property: Report should contain all required course details
            $this->assertArrayHasKey('course_info', $reportData, 
                "Report should contain course_info for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('id', $reportData['course_info'], 
                "Course info should contain id for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('title', $reportData['course_info'], 
                "Course info should contain title for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('code', $reportData['course_info'], 
                "Course info should contain code for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('department', $reportData['course_info'], 
                "Course info should contain department for evaluation {$evaluation->id}");
            
            // Property: Report should contain evaluation period information
            $this->assertArrayHasKey('evaluation_period', $reportData, 
                "Report should contain evaluation_period for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('academic_year', $reportData['evaluation_period'], 
                "Evaluation period should contain academic_year for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('semester', $reportData['evaluation_period'], 
                "Evaluation period should contain semester for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('year_level', $reportData['evaluation_period'], 
                "Evaluation period should contain year_level for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('opened_at', $reportData['evaluation_period'], 
                "Evaluation period should contain opened_at for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('closed_at', $reportData['evaluation_period'], 
                "Evaluation period should contain closed_at for evaluation {$evaluation->id}");
            
            // Property: Report should contain comprehensive statistics
            $this->assertArrayHasKey('statistics', $reportData, 
                "Report should contain statistics for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('overall_performance_score', $reportData['statistics'], 
                "Statistics should contain overall_performance_score for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('average_rating', $reportData['statistics'], 
                "Statistics should contain average_rating for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('weighted_scores', $reportData['statistics'], 
                "Statistics should contain weighted_scores for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('participation', $reportData['statistics'], 
                "Statistics should contain participation for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('rating_distribution', $reportData['statistics'], 
                "Statistics should contain rating_distribution for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('total_responses', $reportData['statistics'], 
                "Statistics should contain total_responses for evaluation {$evaluation->id}");
            
            // Property: Report should contain question analysis
            $this->assertArrayHasKey('question_analysis', $reportData, 
                "Report should contain question_analysis for evaluation {$evaluation->id}");
            $this->assertIsArray($reportData['question_analysis'], 
                "Question analysis should be an array for evaluation {$evaluation->id}");
            
            // Property: Report should have required metadata
            $this->assertArrayHasKey('report_type', $reportData, 
                "Report should contain report_type for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('generated_at', $reportData, 
                "Report should contain generated_at for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('privacy_preserved', $reportData, 
                "Report should contain privacy_preserved for evaluation {$evaluation->id}");
            
            // Property: Report type should be correct
            $this->assertEquals('teacher_evaluation', $reportData['report_type'], 
                "Report type should be 'teacher_evaluation' for evaluation {$evaluation->id}");
            
            // Property: Report should validate as complete
            $this->assertTrue($this->service->validateReportCompleteness($reportData), 
                "Report should validate as complete for evaluation {$evaluation->id}");
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 11: Multi-format Export Support**
     * For any evaluation data export, the system should support CSV, PDF, and Excel 
     * formats with consistent data structure
     * **Validates: Requirements 3.2**
     */
    public function test_multi_format_export_support_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Create random number of students and responses
            $numStudents = $this->faker->numberBetween(3, 10);
            $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
            
            // Create questions
            $questions = Question::factory()->count(2)->create();
            
            foreach ($students as $student) {
                // Create submission
                $submission = EvaluationSubmission::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'submitted_at' => now(),
                    'is_anonymous' => true,
                    'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                ]);
                
                // Create feedback
                $feedback = Feedback::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'anonymous' => true,
                    'submission_id' => $submission->id,
                    'is_locked' => true,
                ]);
                
                // Create responses for each question
                foreach ($questions as $question) {
                    $rating = $this->faker->numberBetween(1, 5);
                    Response::create([
                        'feedback_id' => $feedback->id,
                        'question_id' => $question->id,
                        'rating' => $rating,
                        'text' => $this->faker->sentence(),
                    ]);
                }
            }
            
            // Generate teacher report
            $reportData = $this->service->generateTeacherReport($evaluation->id);
            
            // Property: All supported formats should be available
            $availableFormats = $this->service->getAvailableFormats();
            $this->assertArrayHasKey('csv', $availableFormats, 
                "CSV format should be available for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('pdf', $availableFormats, 
                "PDF format should be available for evaluation {$evaluation->id}");
            $this->assertArrayHasKey('excel', $availableFormats, 
                "Excel format should be available for evaluation {$evaluation->id}");
            
            // Property: Each format should have required metadata
            foreach (['csv', 'pdf', 'excel'] as $format) {
                $this->assertArrayHasKey('name', $availableFormats[$format], 
                    "{$format} format should have name for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('description', $availableFormats[$format], 
                    "{$format} format should have description for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('extension', $availableFormats[$format], 
                    "{$format} format should have extension for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('mime_type', $availableFormats[$format], 
                    "{$format} format should have mime_type for evaluation {$evaluation->id}");
            }
            
            // Property: CSV export should work and return valid file path
            $csvPath = $this->service->exportToCSV($reportData, false);
            $this->assertIsString($csvPath, 
                "CSV export should return string path for evaluation {$evaluation->id}");
            $this->assertStringContainsString('.csv', $csvPath, 
                "CSV export path should contain .csv extension for evaluation {$evaluation->id}");
            $this->assertTrue(Storage::exists($csvPath), 
                "CSV file should exist in storage for evaluation {$evaluation->id}");
            
            // Property: CSV content should contain report data
            $csvContent = Storage::get($csvPath);
            $this->assertIsString($csvContent, 
                "CSV content should be string for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['teacher_info']['name'], $csvContent, 
                "CSV should contain teacher name for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['course_info']['title'], $csvContent, 
                "CSV should contain course title for evaluation {$evaluation->id}");
            $this->assertStringContainsString((string)$reportData['statistics']['total_responses'], $csvContent, 
                "CSV should contain total responses for evaluation {$evaluation->id}");
            
            // Property: PDF export should work and return valid file path
            $pdfPath = $this->service->exportToPDF($reportData, false);
            $this->assertIsString($pdfPath, 
                "PDF export should return string path for evaluation {$evaluation->id}");
            $this->assertStringContainsString('.html', $pdfPath, 
                "PDF export path should contain .html extension (temp implementation) for evaluation {$evaluation->id}");
            $this->assertTrue(Storage::exists($pdfPath), 
                "PDF file should exist in storage for evaluation {$evaluation->id}");
            
            // Property: PDF/HTML content should contain report data
            $pdfContent = Storage::get($pdfPath);
            $this->assertIsString($pdfContent, 
                "PDF content should be string for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['teacher_info']['name'], $pdfContent, 
                "PDF should contain teacher name for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['course_info']['title'], $pdfContent, 
                "PDF should contain course title for evaluation {$evaluation->id}");
            
            // Property: Excel export should work and return valid file path
            $excelPath = $this->service->exportToExcel($reportData, false);
            $this->assertIsString($excelPath, 
                "Excel export should return string path for evaluation {$evaluation->id}");
            $this->assertStringContainsString('.csv', $excelPath, 
                "Excel export path should contain .csv extension (temp implementation) for evaluation {$evaluation->id}");
            $this->assertTrue(Storage::exists($excelPath), 
                "Excel file should exist in storage for evaluation {$evaluation->id}");
            
            // Property: Excel content should contain report data
            $excelContent = Storage::get($excelPath);
            $this->assertIsString($excelContent, 
                "Excel content should be string for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['teacher_info']['name'], $excelContent, 
                "Excel should contain teacher name for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['course_info']['title'], $excelContent, 
                "Excel should contain course title for evaluation {$evaluation->id}");
            
            // Property: All formats should contain consistent core data
            $formats = ['csv' => $csvContent, 'pdf' => $pdfContent, 'excel' => $excelContent];
            foreach ($formats as $formatName => $content) {
                $this->assertStringContainsString($reportData['teacher_info']['name'], $content, 
                    "{$formatName} should contain teacher name for evaluation {$evaluation->id}");
                $this->assertStringContainsString($reportData['course_info']['title'], $content, 
                    "{$formatName} should contain course title for evaluation {$evaluation->id}");
                $this->assertStringContainsString($reportData['course_info']['department'], $content, 
                    "{$formatName} should contain department for evaluation {$evaluation->id}");
            }
            
            // Clean up files for next iteration
            Storage::delete([$csvPath, $pdfPath, $excelPath]);
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 14: Privacy Preservation in Exports**
     * For any report export, individual student identities should be excluded while 
     * maintaining statistical accuracy
     * **Validates: Requirements 3.5**
     */
    public function test_privacy_preservation_in_exports_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Create random number of students and responses
            $numStudents = $this->faker->numberBetween(3, 10);
            $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
            
            // Create questions
            $questions = Question::factory()->count(2)->create();
            
            $studentNames = [];
            $studentEmails = [];
            
            foreach ($students as $student) {
                $studentNames[] = $student->name;
                $studentEmails[] = $student->email;
                
                // Create submission
                $submission = EvaluationSubmission::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'submitted_at' => now(),
                    'is_anonymous' => true,
                    'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                ]);
                
                // Create feedback
                $feedback = Feedback::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'anonymous' => true,
                    'submission_id' => $submission->id,
                    'is_locked' => true,
                ]);
                
                // Create responses for each question
                foreach ($questions as $question) {
                    $rating = $this->faker->numberBetween(1, 5);
                    Response::create([
                        'feedback_id' => $feedback->id,
                        'question_id' => $question->id,
                        'rating' => $rating,
                        'text' => $this->faker->sentence(),
                    ]);
                }
            }
            
            // Generate teacher report
            $reportData = $this->service->generateTeacherReport($evaluation->id);
            
            // Store original statistics for comparison
            $originalStats = $reportData['statistics'];
            
            // Property: Privacy-preserved export should maintain statistical accuracy
            $csvPathPrivate = $this->service->exportToCSV($reportData, true);
            $csvContentPrivate = Storage::get($csvPathPrivate);
            
            // Property: Privacy-preserved export should not contain student names
            foreach ($studentNames as $studentName) {
                $this->assertStringNotContainsString($studentName, $csvContentPrivate, 
                    "Privacy-preserved CSV should not contain student name '{$studentName}' for evaluation {$evaluation->id}");
            }
            
            // Property: Privacy-preserved export should not contain student emails
            foreach ($studentEmails as $studentEmail) {
                $this->assertStringNotContainsString($studentEmail, $csvContentPrivate, 
                    "Privacy-preserved CSV should not contain student email '{$studentEmail}' for evaluation {$evaluation->id}");
            }
            
            // Property: Privacy-preserved export should still contain statistical data
            $this->assertStringContainsString((string)$originalStats['total_responses'], $csvContentPrivate, 
                "Privacy-preserved CSV should contain total responses for evaluation {$evaluation->id}");
            $this->assertStringContainsString((string)$originalStats['average_rating'], $csvContentPrivate, 
                "Privacy-preserved CSV should contain average rating for evaluation {$evaluation->id}");
            $this->assertStringContainsString((string)$originalStats['overall_performance_score'], $csvContentPrivate, 
                "Privacy-preserved CSV should contain performance score for evaluation {$evaluation->id}");
            
            // Property: Privacy-preserved export should contain teacher information (not student info)
            $this->assertStringContainsString($reportData['teacher_info']['name'], $csvContentPrivate, 
                "Privacy-preserved CSV should contain teacher name for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['course_info']['title'], $csvContentPrivate, 
                "Privacy-preserved CSV should contain course title for evaluation {$evaluation->id}");
            
            // Property: Privacy flag should be set correctly
            $this->assertStringContainsString('"Privacy Preserved","Yes"', $csvContentPrivate, 
                "Privacy-preserved CSV should indicate privacy preservation for evaluation {$evaluation->id}");
            
            // Test department report privacy preservation
            $departmentReport = $this->service->generateDepartmentReport($department->id, $evaluation->academic_year, $evaluation->semester);
            $originalTeacherNames = [];
            foreach ($departmentReport['teacher_performances'] as $performance) {
                $originalTeacherNames[] = $performance['teacher_name'];
            }
            
            // Property: Department report privacy preservation should anonymize teacher names
            $deptCsvPathPrivate = $this->service->exportToCSV($departmentReport, true);
            $deptCsvContentPrivate = Storage::get($deptCsvPathPrivate);
            
            // Property: Privacy-preserved department report should not contain original teacher names
            foreach ($originalTeacherNames as $teacherName) {
                $this->assertStringNotContainsString($teacherName, $deptCsvContentPrivate, 
                    "Privacy-preserved department CSV should not contain teacher name '{$teacherName}' for evaluation {$evaluation->id}");
            }
            
            // Property: Privacy-preserved department report should contain anonymized identifiers
            $this->assertStringContainsString('Teacher ', $deptCsvContentPrivate, 
                "Privacy-preserved department CSV should contain anonymized teacher identifiers for evaluation {$evaluation->id}");
            
            // Property: Privacy-preserved department report should maintain statistical accuracy
            $this->assertStringContainsString((string)$departmentReport['department_statistics']['total_evaluations'], $deptCsvContentPrivate, 
                "Privacy-preserved department CSV should contain total evaluations for evaluation {$evaluation->id}");
            $this->assertStringContainsString((string)$departmentReport['department_statistics']['total_responses'], $deptCsvContentPrivate, 
                "Privacy-preserved department CSV should contain total responses for evaluation {$evaluation->id}");
            
            // Test PDF privacy preservation
            $pdfPathPrivate = $this->service->exportToPDF($reportData, true);
            $pdfContentPrivate = Storage::get($pdfPathPrivate);
            
            // Property: Privacy-preserved PDF should not contain student names
            foreach ($studentNames as $studentName) {
                $this->assertStringNotContainsString($studentName, $pdfContentPrivate, 
                    "Privacy-preserved PDF should not contain student name '{$studentName}' for evaluation {$evaluation->id}");
            }
            
            // Property: Privacy-preserved PDF should contain statistical data
            $this->assertStringContainsString((string)$originalStats['total_responses'], $pdfContentPrivate, 
                "Privacy-preserved PDF should contain total responses for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['teacher_info']['name'], $pdfContentPrivate, 
                "Privacy-preserved PDF should contain teacher name for evaluation {$evaluation->id}");
            
            // Test Excel privacy preservation
            $excelPathPrivate = $this->service->exportToExcel($reportData, true);
            $excelContentPrivate = Storage::get($excelPathPrivate);
            
            // Property: Privacy-preserved Excel should not contain student names
            foreach ($studentNames as $studentName) {
                $this->assertStringNotContainsString($studentName, $excelContentPrivate, 
                    "Privacy-preserved Excel should not contain student name '{$studentName}' for evaluation {$evaluation->id}");
            }
            
            // Property: Privacy-preserved Excel should contain statistical data
            $this->assertStringContainsString((string)$originalStats['total_responses'], $excelContentPrivate, 
                "Privacy-preserved Excel should contain total responses for evaluation {$evaluation->id}");
            $this->assertStringContainsString($reportData['teacher_info']['name'], $excelContentPrivate, 
                "Privacy-preserved Excel should contain teacher name for evaluation {$evaluation->id}");
            
            // Property: Non-privacy-preserved export should contain teacher email (if present)
            $csvPathNonPrivate = $this->service->exportToCSV($reportData, false);
            $csvContentNonPrivate = Storage::get($csvPathNonPrivate);
            
            // Property: Non-privacy-preserved export should indicate privacy status correctly
            $this->assertStringContainsString('"Privacy Preserved","No"', $csvContentNonPrivate, 
                "Non-privacy-preserved CSV should indicate no privacy preservation for evaluation {$evaluation->id}");
            
            // Clean up files for next iteration
            Storage::delete([$csvPathPrivate, $deptCsvPathPrivate, $pdfPathPrivate, $excelPathPrivate, $csvPathNonPrivate]);
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 8: Question Analysis Completeness**
     * For any individual evaluation result, the question-by-question analysis should 
     * include average ratings and response distributions for all questions
     * **Validates: Requirements 2.4**
     */
    public function test_question_analysis_completeness_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Create random number of questions (at least 2, max 5)
            $numQuestions = $this->faker->numberBetween(2, 5);
            $questions = Question::factory()->count($numQuestions)->create();
            $evaluation->questions()->attach($questions->pluck('id'));
            
            // Create random number of students and responses
            $numStudents = $this->faker->numberBetween(3, 15);
            $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
            
            // Track expected data for verification - initialize for all questions
            $expectedQuestionData = [];
            foreach ($questions as $question) {
                $expectedQuestionData[$question->id] = [
                    'question_text' => $question->text,
                    'category' => $question->type,
                    'ratings' => [],
                ];
            }
            
            foreach ($students as $student) {
                // Create submission
                $submission = EvaluationSubmission::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'submitted_at' => now(),
                    'is_anonymous' => true,
                    'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                ]);
                
                // Create feedback
                $feedback = Feedback::create([
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                    'anonymous' => true,
                    'submission_id' => $submission->id,
                    'is_locked' => true,
                ]);
                
                // Create responses for each question
                foreach ($questions as $question) {
                    $rating = $this->faker->numberBetween(1, 5);
                    Response::create([
                        'feedback_id' => $feedback->id,
                        'question_id' => $question->id,
                        'rating' => $rating,
                        'text' => $this->faker->sentence(),
                    ]);
                    
                    // Track expected data
                    $expectedQuestionData[$question->id]['ratings'][] = $rating;
                }
            }
            
            // Calculate expected values for each question that has responses
            $questionsWithResponses = [];
            foreach ($expectedQuestionData as $questionId => &$data) {
                if (!empty($data['ratings'])) {
                    $ratings = $data['ratings'];
                    $ratingsCollection = collect($ratings);
                    $data['expected_average'] = round($ratingsCollection->avg(), 2);
                    $data['expected_total_responses'] = count($ratings);
                    $data['expected_distribution'] = array_count_values($ratings);
                    $data['expected_performance_percentage'] = round(($ratingsCollection->avg() / 5) * 100, 1);
                    $questionsWithResponses[$questionId] = $data;
                }
            }
            
            // Generate teacher report
            $reportData = $this->service->generateTeacherReport($evaluation->id);
            
            // Property: Report should contain question analysis
            $this->assertArrayHasKey('question_analysis', $reportData, 
                "Report should contain question_analysis for evaluation {$evaluation->id}");
            $this->assertIsArray($reportData['question_analysis'], 
                "Question analysis should be an array for evaluation {$evaluation->id}");
            
            // Property: Question analysis should include all questions that have responses
            $this->assertCount(count($questionsWithResponses), $reportData['question_analysis'], 
                "Question analysis should include all questions with responses for evaluation {$evaluation->id}");
            
            // Property: Each question analysis should contain all required fields
            foreach ($reportData['question_analysis'] as $questionAnalysis) {
                $this->assertArrayHasKey('question_id', $questionAnalysis, 
                    "Question analysis should contain question_id for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('question_text', $questionAnalysis, 
                    "Question analysis should contain question_text for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('category', $questionAnalysis, 
                    "Question analysis should contain category for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('average_rating', $questionAnalysis, 
                    "Question analysis should contain average_rating for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('total_responses', $questionAnalysis, 
                    "Question analysis should contain total_responses for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('rating_distribution', $questionAnalysis, 
                    "Question analysis should contain rating_distribution for evaluation {$evaluation->id}");
                $this->assertArrayHasKey('performance_percentage', $questionAnalysis, 
                    "Question analysis should contain performance_percentage for evaluation {$evaluation->id}");
                
                // Property: Question analysis data should match expected values
                $questionId = $questionAnalysis['question_id'];
                $expectedData = $questionsWithResponses[$questionId];
                
                $this->assertEquals($expectedData['question_text'], $questionAnalysis['question_text'], 
                    "Question text should match for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertEquals($expectedData['category'], $questionAnalysis['category'], 
                    "Question category should match for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertEquals($expectedData['expected_average'], $questionAnalysis['average_rating'], 
                    "Average rating should match expected value for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertEquals($expectedData['expected_total_responses'], $questionAnalysis['total_responses'], 
                    "Total responses should match expected value for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertEquals($expectedData['expected_performance_percentage'], $questionAnalysis['performance_percentage'], 
                    "Performance percentage should match expected value for question {$questionId} in evaluation {$evaluation->id}");
                
                // Property: Rating distribution should match expected distribution
                $actualDistribution = [];
                foreach ($questionAnalysis['rating_distribution'] as $rating => $data) {
                    if ($data['count'] > 0) {
                        $actualDistribution[$rating] = $data['count'];
                    }
                }
                $this->assertEquals($expectedData['expected_distribution'], $actualDistribution, 
                    "Rating distribution should match expected values for question {$questionId} in evaluation {$evaluation->id}");
                
                // Property: Average rating should be within valid range (1-5)
                $this->assertGreaterThanOrEqual(1, $questionAnalysis['average_rating'], 
                    "Average rating should be >= 1 for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertLessThanOrEqual(5, $questionAnalysis['average_rating'], 
                    "Average rating should be <= 5 for question {$questionId} in evaluation {$evaluation->id}");
                
                // Property: Performance percentage should be within valid range (20-100%)
                $this->assertGreaterThanOrEqual(20, $questionAnalysis['performance_percentage'], 
                    "Performance percentage should be >= 20% for question {$questionId} in evaluation {$evaluation->id}");
                $this->assertLessThanOrEqual(100, $questionAnalysis['performance_percentage'], 
                    "Performance percentage should be <= 100% for question {$questionId} in evaluation {$evaluation->id}");
                
                // Property: Total responses should be positive
                $this->assertGreaterThan(0, $questionAnalysis['total_responses'], 
                    "Total responses should be > 0 for question {$questionId} in evaluation {$evaluation->id}");
                
                // Property: Rating distribution should contain only valid ratings (1-5)
                foreach ($questionAnalysis['rating_distribution'] as $rating => $count) {
                    $this->assertGreaterThanOrEqual(1, $rating, 
                        "Rating in distribution should be >= 1 for question {$questionId} in evaluation {$evaluation->id}");
                    $this->assertLessThanOrEqual(5, $rating, 
                        "Rating in distribution should be <= 5 for question {$questionId} in evaluation {$evaluation->id}");
                    $this->assertGreaterThan(0, $count, 
                        "Rating count should be > 0 for question {$questionId} in evaluation {$evaluation->id}");
                }
                
                // Property: Sum of rating distribution should equal total responses
                $distributionSum = 0;
                foreach ($questionAnalysis['rating_distribution'] as $rating => $data) {
                    $distributionSum += $data['count'];
                }
                $this->assertEquals($questionAnalysis['total_responses'], $distributionSum, 
                    "Sum of rating distribution should equal total responses for question {$questionId} in evaluation {$evaluation->id}");
            }
            
            // Property: Questions should be sorted by average rating (descending)
            $averageRatings = array_column($reportData['question_analysis'], 'average_rating');
            $sortedRatings = $averageRatings;
            rsort($sortedRatings);
            $this->assertEquals($sortedRatings, $averageRatings, 
                "Questions should be sorted by average rating in descending order for evaluation {$evaluation->id}");
        }
    }
}