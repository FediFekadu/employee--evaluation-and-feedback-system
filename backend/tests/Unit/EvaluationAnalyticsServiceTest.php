<?php

namespace Tests\Unit;

use Tests\TestCase;
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
use Faker\Factory as Faker;
use Carbon\Carbon;

class EvaluationAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    private EvaluationAnalyticsService $service;
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EvaluationAnalyticsService();
        $this->faker = Faker::create();
    }

    /**
     * **Feature: evaluation-submission-control, Property 6: Weighted Score Calculation**
     * For any evaluation with student, peer, and admin scores, the weighted calculation 
     * should follow the formula: (Student × 0.5) + (Peer × 0.3) + (Admin × 0.2)
     * **Validates: Requirements 2.2**
     */
    public function test_weighted_score_calculation_property()
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
            $numStudents = $this->faker->numberBetween(5, 20);
            $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
            
            // Create questions
            $questions = Question::factory()->count(3)->create();
            
            $totalRating = 0;
            $responseCount = 0;
            
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
                    
                    $totalRating += $rating;
                    $responseCount++;
                }
            }
            
            // Calculate expected values
            $expectedAverageRating = $responseCount > 0 ? $totalRating / $responseCount : 0;
            $expectedPercentageScore = ($expectedAverageRating / 5) * 100; // Convert to percentage
            
            // Get weighted scores from service
            $result = $this->service->calculateWeightedScores($evaluation->id);
            
            // Property: Student score should equal the average rating converted to percentage
            $this->assertEquals(
                round($expectedPercentageScore, 2),
                $result['student_score'],
                "Student score should equal average rating converted to percentage for evaluation {$evaluation->id}"
            );
            
            // Property: Weighted score should follow the formula (Student × 0.5) + (Peer × 0.3) + (Admin × 0.2)
            $expectedWeightedScore = ($result['student_score'] * 0.5) + 
                                   ($result['peer_score'] * 0.3) + 
                                   ($result['admin_score'] * 0.2);
            
            $this->assertEquals(
                round($expectedWeightedScore, 2),
                $result['weighted_score'],
                "Weighted score should follow the formula (Student × 0.5) + (Peer × 0.3) + (Admin × 0.2) for evaluation {$evaluation->id}"
            );
            
            // Property: All scores should be within valid range (0-100% for percentage scale)
            $this->assertGreaterThanOrEqual(0, $result['student_score'], "Student score should be >= 0%");
            $this->assertLessThanOrEqual(100, $result['student_score'], "Student score should be <= 100%");
            $this->assertGreaterThanOrEqual(0, $result['weighted_score'], "Weighted score should be >= 0%");
            $this->assertLessThanOrEqual(100, $result['weighted_score'], "Weighted score should be <= 100%");
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 5: Statistical Accuracy**
     * For any evaluation with responses, the displayed statistics (average ratings, 
     * response counts, participation rates) should accurately reflect the underlying data
     * **Validates: Requirements 2.1**
     */
    public function test_statistical_accuracy_property()
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

            // Create random number of eligible students
            $totalEligibleStudents = $this->faker->numberBetween(10, 30);
            $students = Student::factory()->count($totalEligibleStudents)->create(['department_id' => $department->id]);
            
            // Enroll students in the course
            foreach ($students as $student) {
                $student->courses()->attach($course->id);
            }
            
            // Create random number of actual submissions (subset of eligible students)
            $numSubmissions = $this->faker->numberBetween(1, $totalEligibleStudents);
            $submittingStudents = $students->take($numSubmissions);
            
            // Create questions
            $questions = Question::factory()->count(3)->create();
            
            $allRatings = [];
            $totalResponses = 0;
            
            foreach ($submittingStudents as $student) {
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
                    
                    $allRatings[] = $rating;
                    $totalResponses++;
                }
            }
            
            // Calculate expected values
            $expectedAverageRating = count($allRatings) > 0 ? array_sum($allRatings) / count($allRatings) : 0;
            $expectedParticipationRate = ($numSubmissions / $totalEligibleStudents) * 100;
            
            // Get statistics from service
            $stats = $this->service->generateEvaluationStatistics($evaluation->id);
            
            // Property: Average rating should accurately reflect the underlying data
            $this->assertEquals(
                round($expectedAverageRating, 2),
                $stats['average_rating'],
                "Average rating should accurately reflect underlying data for evaluation {$evaluation->id}"
            );
            
            // Property: Response count should match actual responses
            $this->assertEquals(
                $totalResponses,
                $stats['total_responses'],
                "Response count should match actual responses for evaluation {$evaluation->id}"
            );
            
            // Property: Participation rate should be accurately calculated
            $this->assertEquals(
                round($expectedParticipationRate, 2),
                $stats['participation']['participation_rate'],
                "Participation rate should be accurately calculated for evaluation {$evaluation->id}"
            );
            
            // Property: Total eligible students should match enrolled students
            $this->assertEquals(
                $totalEligibleStudents,
                $stats['participation']['total_eligible_students'],
                "Total eligible students should match enrolled students for evaluation {$evaluation->id}"
            );
            
            // Property: Total submissions should match actual submissions
            $this->assertEquals(
                $numSubmissions,
                $stats['participation']['total_submissions'],
                "Total submissions should match actual submissions for evaluation {$evaluation->id}"
            );
            
            // Property: Remaining students should be calculated correctly
            $expectedRemaining = $totalEligibleStudents - $numSubmissions;
            $this->assertEquals(
                $expectedRemaining,
                $stats['participation']['remaining_students'],
                "Remaining students should be calculated correctly for evaluation {$evaluation->id}"
            );
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 7: Performance Score Normalization**
     * For any evaluation with responses, the overall performance score should be 
     * calculated and displayed as a percentage out of 100%
     * **Validates: Requirements 2.3**
     */
    public function test_performance_score_normalization_property()
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
            
            $allRatings = [];
            
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
                    
                    $allRatings[] = $rating;
                }
            }
            
            // Calculate expected values
            $averageRating = count($allRatings) > 0 ? array_sum($allRatings) / count($allRatings) : 0;
            $maxPossibleRating = 5; // 5-point scale
            $expectedPerformanceScore = $averageRating > 0 ? ($averageRating / $maxPossibleRating) * 100 : 0;
            
            // Get statistics from service
            $stats = $this->service->generateEvaluationStatistics($evaluation->id);
            
            // Property: Performance score should be normalized to percentage (0-100%)
            $this->assertEquals(
                round($expectedPerformanceScore, 2),
                $stats['performance_score'],
                "Performance score should be normalized to percentage for evaluation {$evaluation->id}"
            );
            
            // Property: Performance score should be within valid range (0-100%)
            $this->assertGreaterThanOrEqual(0, $stats['performance_score'], 
                "Performance score should be >= 0% for evaluation {$evaluation->id}");
            $this->assertLessThanOrEqual(100, $stats['performance_score'], 
                "Performance score should be <= 100% for evaluation {$evaluation->id}");
            
            // Property: Performance score should correlate with average rating
            if ($averageRating > 0) {
                $this->assertGreaterThan(0, $stats['performance_score'], 
                    "Performance score should be > 0% when there are ratings for evaluation {$evaluation->id}");
            }
            
            // Property: Perfect rating (5.0) should result in 100% performance score
            if (abs($averageRating - 5.0) < 0.01) {
                $this->assertEquals(100.0, $stats['performance_score'], 
                    "Perfect rating should result in 100% performance score for evaluation {$evaluation->id}");
            }
            
            // Property: Minimum rating (1.0) should result in 20% performance score
            if (abs($averageRating - 1.0) < 0.01) {
                $this->assertEquals(20.0, $stats['performance_score'], 
                    "Minimum rating should result in 20% performance score for evaluation {$evaluation->id}");
            }
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 17: Low Participation Detection**
     * For any evaluation with participation below threshold, reminder notification tools should be available
     * **Validates: Requirements 4.3**
     */
    public function test_low_participation_detection_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            
            // Create multiple courses and evaluations
            $numCourses = $this->faker->numberBetween(2, 5);
            $evaluations = [];
            
            for ($j = 0; $j < $numCourses; $j++) {
                $course = Course::factory()->create(['department_id' => $department->id]);
                $teacher = Teacher::factory()->create(['department_id' => $department->id]);
                
                $evaluation = Evaluation::create([
                    'course_id' => $course->id,
                    'teacher_id' => $teacher->id,
                    'academic_year' => $this->faker->year(),
                    'semester' => $this->faker->numberBetween(1, 2),
                    'year_level' => $this->faker->numberBetween(1, 4),
                    'opened_at' => now()->subDays(10),
                    'closed_at' => now()->addDays($this->faker->numberBetween(1, 10)), // Still active
                ]);
                
                // Create random number of eligible students
                $totalEligibleStudents = $this->faker->numberBetween(10, 30);
                $students = Student::factory()->count($totalEligibleStudents)->create(['department_id' => $department->id]);
                
                // Enroll students in the course
                foreach ($students as $student) {
                    $student->courses()->attach($course->id);
                }
                
                // Create submissions for a random percentage of students (some below threshold)
                $participationRate = $this->faker->numberBetween(10, 80); // Random participation rate
                $numSubmissions = intval(($participationRate / 100) * $totalEligibleStudents);
                $submittingStudents = $students->take($numSubmissions);
                
                foreach ($submittingStudents as $student) {
                    EvaluationSubmission::create([
                        'evaluation_id' => $evaluation->id,
                        'student_id' => $student->id,
                        'submitted_at' => now(),
                        'is_anonymous' => true,
                        'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                    ]);
                }
                
                $evaluations[] = [
                    'evaluation' => $evaluation,
                    'expected_participation_rate' => $participationRate,
                    'total_eligible' => $totalEligibleStudents,
                    'total_submissions' => $numSubmissions,
                ];
            }
            
            // Test different thresholds
            $thresholds = [30.0, 50.0, 70.0];
            
            foreach ($thresholds as $threshold) {
                $result = $this->service->detectLowParticipation($department->id, $threshold);
                
                // Property: Result should contain correct department and threshold
                $this->assertEquals($department->id, $result['department_id'], 
                    "Result should contain correct department ID");
                $this->assertEquals($threshold, $result['threshold'], 
                    "Result should contain correct threshold");
                
                // Property: Only evaluations below threshold should be flagged
                foreach ($result['low_participation_evaluations'] as $flaggedEval) {
                    $this->assertLessThan($threshold, $flaggedEval['participation_rate'], 
                        "Only evaluations below threshold should be flagged");
                    
                    // Property: Flagged evaluations should have valid data
                    $this->assertGreaterThanOrEqual(0, $flaggedEval['participation_rate'], 
                        "Participation rate should be >= 0");
                    $this->assertLessThanOrEqual(100, $flaggedEval['participation_rate'], 
                        "Participation rate should be <= 100");
                    $this->assertGreaterThanOrEqual(0, $flaggedEval['total_submissions'], 
                        "Total submissions should be >= 0");
                    $this->assertGreaterThan(0, $flaggedEval['total_eligible_students'], 
                        "Total eligible students should be > 0");
                    $this->assertGreaterThanOrEqual(0, $flaggedEval['remaining_students'], 
                        "Remaining students should be >= 0");
                    $this->assertGreaterThanOrEqual(0, $flaggedEval['days_remaining'], 
                        "Days remaining should be >= 0");
                    $this->assertGreaterThanOrEqual(1, $flaggedEval['urgency_level'], 
                        "Urgency level should be >= 1");
                    $this->assertLessThanOrEqual(5, $flaggedEval['urgency_level'], 
                        "Urgency level should be <= 5");
                }
                
                // Property: Total flagged count should match array length
                $this->assertEquals(count($result['low_participation_evaluations']), $result['total_flagged'], 
                    "Total flagged count should match array length");
                
                // Property: Evaluations should be sorted by urgency and participation rate
                $flaggedEvals = $result['low_participation_evaluations'];
                for ($k = 1; $k < count($flaggedEvals); $k++) {
                    $prev = $flaggedEvals[$k-1];
                    $curr = $flaggedEvals[$k];
                    
                    if ($prev['urgency_level'] === $curr['urgency_level']) {
                        $this->assertLessThanOrEqual($curr['participation_rate'], $prev['participation_rate'], 
                            "Evaluations with same urgency should be sorted by participation rate");
                    } else {
                        $this->assertGreaterThanOrEqual($curr['urgency_level'], $prev['urgency_level'], 
                            "Evaluations should be sorted by urgency level (descending)");
                    }
                }
            }
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 18: Closure Summary Generation**
     * For any closed evaluation, participation summary reports should accurately show 
     * completion rates by course and year level
     * **Validates: Requirements 4.4**
     */
    public function test_closure_summary_generation_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            
            // Create multiple courses and closed evaluations
            $numCourses = $this->faker->numberBetween(2, 4);
            $expectedCourseStats = [];
            $expectedYearStats = [];
            $totalEligible = 0;
            $totalSubmissions = 0;
            $courseStudentMap = []; // Track students per course to avoid double counting
            $allEvaluations = []; // Track all evaluations for proper counting
            
            for ($j = 0; $j < $numCourses; $j++) {
                $course = Course::factory()->create(['department_id' => $department->id]);
                $teacher = Teacher::factory()->create(['department_id' => $department->id]);
                
                // Create students for this course (shared across all evaluations for this course)
                $eligibleStudents = $this->faker->numberBetween(5, 20);
                $students = Student::factory()->count($eligibleStudents)->create(['department_id' => $department->id]);
                
                // Enroll students in the course
                foreach ($students as $student) {
                    $student->courses()->attach($course->id);
                }
                
                $courseStudentMap[$course->id] = $students;
                
                // Create evaluations for different year levels
                $yearLevels = $this->faker->randomElements([1, 2, 3, 4], $this->faker->numberBetween(1, 3));
                
                foreach ($yearLevels as $yearLevel) {
                    $evaluation = Evaluation::create([
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $this->faker->year(),
                        'semester' => $this->faker->numberBetween(1, 2),
                        'year_level' => $yearLevel,
                        'opened_at' => now()->subDays(20),
                        'closed_at' => now()->subDays($this->faker->numberBetween(1, 10)), // Already closed
                    ]);
                    
                    $allEvaluations[] = $evaluation;
                    
                    // Create submissions for a random percentage of students (using the same students for this course)
                    $participationRate = $this->faker->numberBetween(30, 95);
                    $numSubmissions = intval(($participationRate / 100) * $eligibleStudents);
                    $submittingStudents = $students->take($numSubmissions);
                    
                    foreach ($submittingStudents as $student) {
                        EvaluationSubmission::create([
                            'evaluation_id' => $evaluation->id,
                            'student_id' => $student->id,
                            'submitted_at' => now()->subDays($this->faker->numberBetween(1, 15)),
                            'is_anonymous' => true,
                            'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
                        ]);
                    }
                    
                    // Track expected statistics (correctly - each evaluation uses the same course students)
                    $courseKey = $course->id;
                    if (!isset($expectedCourseStats[$courseKey])) {
                        $expectedCourseStats[$courseKey] = [
                            'course_code' => $course->code,
                            'total_eligible' => $eligibleStudents, // Same students for all evaluations of this course
                            'total_submissions' => 0,
                            'evaluation_count' => 0,
                        ];
                    }
                    $expectedCourseStats[$courseKey]['total_submissions'] += $numSubmissions;
                    $expectedCourseStats[$courseKey]['evaluation_count']++;
                    
                    if (!isset($expectedYearStats[$yearLevel])) {
                        $expectedYearStats[$yearLevel] = [
                            'total_eligible' => 0,
                            'total_submissions' => 0,
                        ];
                    }
                    $expectedYearStats[$yearLevel]['total_eligible'] += $eligibleStudents;
                    $expectedYearStats[$yearLevel]['total_submissions'] += $numSubmissions;
                    
                    $totalSubmissions += $numSubmissions;
                }
                
                // Add course eligible students to total (once per course, not per evaluation)
                $totalEligible += $eligibleStudents;
            }
            
            // Calculate expected completion rates
            foreach ($expectedCourseStats as &$course) {
                // Total possible submissions = eligible students * number of evaluations for this course
                $totalPossibleSubmissions = $course['total_eligible'] * $course['evaluation_count'];
                $course['completion_rate'] = $totalPossibleSubmissions > 0 
                    ? round(($course['total_submissions'] / $totalPossibleSubmissions) * 100, 2)
                    : 0;
            }
            
            foreach ($expectedYearStats as $yearLevel => &$year) {
                $year['completion_rate'] = $year['total_eligible'] > 0 
                    ? round(($year['total_submissions'] / $year['total_eligible']) * 100, 2)
                    : 0;
            }
            
            $expectedOverallRate = $totalEligible > 0 
                ? round(($totalSubmissions / $totalEligible) * 100, 2)
                : 0;
            
            // Generate participation summary
            $summary = $this->service->generateParticipationSummary($department->id, 'current_semester');
            
            // Property: Overall participation rate should be accurately calculated
            $this->assertEquals($expectedOverallRate, $summary['overall_participation_rate'], 
                "Overall participation rate should be accurately calculated");
            
            // Property: Total eligible students should match sum of all evaluations
            $this->assertEquals($totalEligible, $summary['total_eligible_students'], 
                "Total eligible students should match sum of all evaluations");
            
            // Property: Total submissions should match sum of all evaluations
            $this->assertEquals($totalSubmissions, $summary['total_submissions'], 
                "Total submissions should match sum of all evaluations");
            
            // Property: Course statistics should be accurate
            foreach ($summary['course_statistics'] as $courseStats) {
                $courseId = null;
                foreach ($expectedCourseStats as $id => $expected) {
                    if ($expected['course_code'] === $courseStats['course_code']) {
                        $courseId = $id;
                        break;
                    }
                }
                
                if ($courseId !== null) {
                    $expected = $expectedCourseStats[$courseId];
                    $this->assertEquals($expected['total_eligible'], $courseStats['total_eligible'], 
                        "Course total eligible should match expected for course {$courseStats['course_code']}");
                    $this->assertEquals($expected['total_submissions'], $courseStats['total_submissions'], 
                        "Course total submissions should match expected for course {$courseStats['course_code']}");
                    $this->assertEquals($expected['completion_rate'], $courseStats['completion_rate'], 
                        "Course completion rate should match expected for course {$courseStats['course_code']}");
                }
            }
            
            // Property: Year level statistics should be accurate
            foreach ($summary['year_level_statistics'] as $yearStats) {
                $yearLevel = $yearStats['year_level'];
                if (isset($expectedYearStats[$yearLevel])) {
                    $expected = $expectedYearStats[$yearLevel];
                    $this->assertEquals($expected['total_eligible'], $yearStats['total_eligible'], 
                        "Year level total eligible should match expected for year {$yearLevel}");
                    $this->assertEquals($expected['total_submissions'], $yearStats['total_submissions'], 
                        "Year level total submissions should match expected for year {$yearLevel}");
                    $this->assertEquals($expected['completion_rate'], $yearStats['completion_rate'], 
                        "Year level completion rate should match expected for year {$yearLevel}");
                }
            }
            
            // Property: All completion rates should be within valid range (0-100%)
            foreach ($summary['course_statistics'] as $courseStats) {
                $this->assertGreaterThanOrEqual(0, $courseStats['completion_rate'], 
                    "Course completion rate should be >= 0%");
                $this->assertLessThanOrEqual(100, $courseStats['completion_rate'], 
                    "Course completion rate should be <= 100%");
            }
            
            foreach ($summary['year_level_statistics'] as $yearStats) {
                $this->assertGreaterThanOrEqual(0, $yearStats['completion_rate'], 
                    "Year level completion rate should be >= 0%");
                $this->assertLessThanOrEqual(100, $yearStats['completion_rate'], 
                    "Year level completion rate should be <= 100%");
            }
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 25: Historical Comparison Accuracy**
     * For any historical data analysis, comparison tools should accurately analyze 
     * performance across multiple evaluation periods
     * **Validates: Requirements 6.1**
     */
    public function test_historical_comparison_accuracy_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            
            // Create evaluations across multiple periods
            $periods = ['2023-1', '2023-2', '2024-1'];
            $expectedPeriodStats = [];
            
            foreach ($periods as $period) {
                [$year, $semester] = explode('-', $period);
                
                // Create random number of evaluations for this period
                $numEvaluations = $this->faker->numberBetween(1, 3);
                $periodEvaluations = [];
                $totalPerformanceScore = 0;
                $totalParticipationRate = 0;
                $totalResponses = 0;
                
                for ($j = 0; $j < $numEvaluations; $j++) {
                    $evaluation = Evaluation::create([
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $year,
                        'semester' => $semester,
                        'year_level' => $this->faker->numberBetween(1, 4),
                        'opened_at' => now()->subDays(30),
                        'closed_at' => now()->subDays(10),
                    ]);
                    
                    // Create students and responses
                    $numStudents = $this->faker->numberBetween(5, 15);
                    $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
                    
                    // Enroll students in course
                    foreach ($students as $student) {
                        $student->courses()->attach($course->id);
                    }
                    
                    // Create questions
                    $questions = Question::factory()->count(3)->create();
                    
                    $evaluationResponses = 0;
                    $evaluationRatings = [];
                    
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
                        
                        // Create responses
                        foreach ($questions as $question) {
                            $rating = $this->faker->numberBetween(1, 5);
                            Response::create([
                                'feedback_id' => $feedback->id,
                                'question_id' => $question->id,
                                'rating' => $rating,
                                'text' => $this->faker->sentence(),
                            ]);
                            
                            $evaluationRatings[] = $rating;
                            $evaluationResponses++;
                        }
                    }
                    
                    // Calculate expected stats for this evaluation
                    $avgRating = count($evaluationRatings) > 0 ? array_sum($evaluationRatings) / count($evaluationRatings) : 0;
                    $performanceScore = $avgRating > 0 ? ($avgRating / 5) * 100 : 0;
                    $participationRate = ($numStudents / $numStudents) * 100; // 100% participation in test
                    
                    $totalPerformanceScore += $performanceScore;
                    $totalParticipationRate += $participationRate;
                    $totalResponses += $evaluationResponses;
                    
                    $periodEvaluations[] = [
                        'evaluation_id' => $evaluation->id,
                        'performance_score' => round($performanceScore, 2),
                        'participation_rate' => round($participationRate, 2),
                        'total_responses' => $evaluationResponses,
                    ];
                }
                
                $expectedPeriodStats[$period] = [
                    'period' => $period,
                    'academic_year' => $year,
                    'semester' => $semester,
                    'total_evaluations' => $numEvaluations,
                    'average_performance_score' => $numEvaluations > 0 ? round($totalPerformanceScore / $numEvaluations, 2) : 0,
                    'average_participation_rate' => $numEvaluations > 0 ? round($totalParticipationRate / $numEvaluations, 2) : 0,
                    'total_responses' => $totalResponses,
                    'evaluations' => $periodEvaluations,
                ];
            }
            
            // Get historical comparison from service
            $comparison = $this->service->compareHistoricalPerformance($teacher->id, $periods);
            
            // Property: Comparison should include all requested periods
            $this->assertEquals($periods, $comparison['periods'], 
                "Comparison should include all requested periods");
            $this->assertEquals($teacher->id, $comparison['teacher_id'], 
                "Comparison should include correct teacher ID");
            
            // Property: Each period's statistics should be accurate
            foreach ($comparison['comparisons'] as $periodData) {
                $period = $periodData['period'];
                $expected = $expectedPeriodStats[$period];
                
                $this->assertEquals($expected['academic_year'], $periodData['academic_year'], 
                    "Academic year should match for period {$period}");
                $this->assertEquals($expected['semester'], $periodData['semester'], 
                    "Semester should match for period {$period}");
                $this->assertEquals($expected['total_evaluations'], $periodData['total_evaluations'], 
                    "Total evaluations should match for period {$period}");
                $this->assertEqualsWithDelta($expected['average_performance_score'], $periodData['average_performance_score'], 0.1,
                    "Average performance score should match for period {$period}");
                $this->assertEquals($expected['total_responses'], $periodData['total_responses'], 
                    "Total responses should match for period {$period}");
                
                // Property: Individual evaluation data should be accurate
                $this->assertCount($expected['total_evaluations'], $periodData['evaluations'], 
                    "Number of evaluations should match for period {$period}");
                
                foreach ($periodData['evaluations'] as $evalIndex => $evalData) {
                    $expectedEval = $expected['evaluations'][$evalIndex];
                    $this->assertEquals($expectedEval['evaluation_id'], $evalData['evaluation_id'], 
                        "Evaluation ID should match");
                    $this->assertEquals($expectedEval['performance_score'], $evalData['performance_score'], 
                        "Performance score should match for evaluation {$evalData['evaluation_id']}");
                    $this->assertEquals($expectedEval['total_responses'], $evalData['total_responses'], 
                        "Total responses should match for evaluation {$evalData['evaluation_id']}");
                }
            }
            
            // Property: Analysis should be provided when sufficient data exists
            if (count($periods) >= 2) {
                $this->assertArrayHasKey('analysis', $comparison, 
                    "Analysis should be provided for multiple periods");
                $this->assertArrayHasKey('trend_direction', $comparison['analysis'], 
                    "Analysis should include trend direction");
                $this->assertContains($comparison['analysis']['trend_direction'], 
                    ['improving', 'declining', 'stable', 'insufficient_data'], 
                    "Trend direction should be valid");
            }
            
            // Property: Generated timestamp should be recent
            $this->assertInstanceOf(Carbon::class, $comparison['generated_at'], 
                "Generated timestamp should be Carbon instance");
            $this->assertTrue($comparison['generated_at']->diffInMinutes(Carbon::now()) < 5, 
                "Generated timestamp should be recent");
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 26: Trend Analysis Accuracy**
     * For any trend report generation, performance changes over time should be 
     * accurately calculated and visualized
     * **Validates: Requirements 6.2**
     */
    public function test_trend_analysis_accuracy_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate performance data with known trends
            $dataPoints = $this->faker->numberBetween(3, 8);
            $performanceData = [];
            
            // Create data with a specific trend pattern
            $trendType = $this->faker->randomElement(['improving', 'declining', 'stable', 'volatile']);
            $baseScore = $this->faker->numberBetween(60, 80);
            
            for ($j = 0; $j < $dataPoints; $j++) {
                switch ($trendType) {
                    case 'improving':
                        $score = $baseScore + ($j * $this->faker->numberBetween(2, 5)) + $this->faker->numberBetween(-2, 2);
                        break;
                    case 'declining':
                        $score = $baseScore - ($j * $this->faker->numberBetween(2, 5)) + $this->faker->numberBetween(-2, 2);
                        break;
                    case 'stable':
                        $score = $baseScore + $this->faker->numberBetween(-3, 3);
                        break;
                    case 'volatile':
                        $score = $baseScore + $this->faker->numberBetween(-15, 15);
                        break;
                }
                $performanceData[] = max(0, min(100, $score)); // Clamp to 0-100 range
            }
            
            // Test trend detection
            $significanceThreshold = $this->faker->numberBetween(3, 8);
            $trendAnalysis = $this->service->detectSignificantTrends($performanceData, $significanceThreshold);
            
            // Property: Analysis should include required fields
            $this->assertArrayHasKey('significant_trends', $trendAnalysis, 
                "Analysis should include significant trends");
            $this->assertArrayHasKey('overall_trend', $trendAnalysis, 
                "Analysis should include overall trend");
            $this->assertArrayHasKey('trend_strength', $trendAnalysis, 
                "Analysis should include trend strength");
            $this->assertArrayHasKey('linear_trend', $trendAnalysis, 
                "Analysis should include linear trend data");
            
            // Property: Overall trend should be valid
            $this->assertContains($trendAnalysis['overall_trend'], 
                ['improving', 'declining', 'stable', 'insufficient_data'], 
                "Overall trend should be valid");
            
            // Property: Trend strength should be within valid range (0-100%)
            $this->assertGreaterThanOrEqual(0, $trendAnalysis['trend_strength'], 
                "Trend strength should be >= 0%");
            $this->assertLessThanOrEqual(100, $trendAnalysis['trend_strength'], 
                "Trend strength should be <= 100%");
            
            // Property: Significant trends should meet threshold criteria
            foreach ($trendAnalysis['significant_trends'] as $trend) {
                $this->assertGreaterThanOrEqual($significanceThreshold, abs($trend['change']), 
                    "Significant trend change should meet threshold");
                $this->assertContains($trend['trend_type'], ['improvement', 'decline'], 
                    "Trend type should be valid");
                $this->assertContains($trend['significance_level'], 
                    ['low', 'moderate', 'high', 'very_high'], 
                    "Significance level should be valid");
                $this->assertGreaterThanOrEqual(0, $trend['period_from'], 
                    "Period from should be valid");
                $this->assertLessThan($dataPoints, $trend['period_to'], 
                    "Period to should be valid");
            }
            
            // Property: Linear trend should have valid mathematical properties
            $linearTrend = $trendAnalysis['linear_trend'];
            $this->assertArrayHasKey('slope', $linearTrend, 
                "Linear trend should include slope");
            $this->assertArrayHasKey('intercept', $linearTrend, 
                "Linear trend should include intercept");
            $this->assertArrayHasKey('r_squared', $linearTrend, 
                "Linear trend should include R-squared");
            
            $this->assertGreaterThanOrEqual(0, $linearTrend['r_squared'], 
                "R-squared should be >= 0");
            $this->assertLessThanOrEqual(1, $linearTrend['r_squared'], 
                "R-squared should be <= 1");
            
            // Property: Total periods analyzed should match input
            $this->assertEquals($dataPoints, $trendAnalysis['total_periods_analyzed'], 
                "Total periods analyzed should match input data points");
            
            // Property: Significance threshold should match input
            $this->assertEquals($significanceThreshold, $trendAnalysis['significance_threshold'], 
                "Significance threshold should match input");
            
            // Property: For known improving trends, slope should be positive
            if ($trendType === 'improving' && $trendAnalysis['trend_strength'] > 50) {
                $this->assertGreaterThan(0, $linearTrend['slope'], 
                    "Improving trend should have positive slope");
            }
            
            // Property: For known declining trends, slope should be negative
            if ($trendType === 'declining' && $trendAnalysis['trend_strength'] > 50) {
                $this->assertLessThan(0, $linearTrend['slope'], 
                    "Declining trend should have negative slope");
            }
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 27: Fair Teacher Comparison**
     * For any teacher comparison, metrics should account for different course types 
     * and student populations to ensure fairness
     * **Validates: Requirements 6.3**
     */
    public function test_fair_teacher_comparison_property()
    {
        // Run property test with 50 iterations (reduced to avoid unique constraint issues)
        for ($i = 0; $i < 50; $i++) {
            // Reset faker unique generator to avoid overflow
            $this->faker = Faker::create();
            
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->lexify('???')) . $i . time()
            ]);
            
            // Create multiple teachers with different course types and student populations
            $numTeachers = $this->faker->numberBetween(2, 3);
            $teacherIds = [];
            $expectedTeacherStats = [];
            
            $period = '2024-1';
            [$year, $semester] = explode('-', $period);
            
            for ($j = 0; $j < $numTeachers; $j++) {
                $teacher = Teacher::factory()->create(['department_id' => $department->id]);
                $teacherIds[] = $teacher->id;
                
                // Create courses with different characteristics
                $numCourses = $this->faker->numberBetween(1, 2);
                $teacherCourses = [];
                $totalPerformance = 0;
                $totalEvaluations = 0;
                
                for ($k = 0; $k < $numCourses; $k++) {
                    $course = Course::factory()->create(['department_id' => $department->id]);
                    
                    // Create evaluation with different year levels (affects difficulty)
                    $yearLevel = $this->faker->numberBetween(1, 4);
                    $evaluation = Evaluation::create([
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $year,
                        'semester' => $semester,
                        'year_level' => $yearLevel,
                        'opened_at' => now()->subDays(30),
                        'closed_at' => now()->subDays(10),
                    ]);
                    
                    // Create different student population sizes
                    $populationSize = $this->faker->numberBetween(8, 20);
                    $students = Student::factory()->count($populationSize)->create(['department_id' => $department->id]);
                    
                    // Enroll students in course
                    foreach ($students as $student) {
                        $student->courses()->attach($course->id);
                    }
                    
                    // Create questions and responses
                    $questions = Question::factory()->count(3)->create();
                    $evaluationRatings = [];
                    
                    foreach ($students as $student) {
                        // Create submission
                        $submission = EvaluationSubmission::create([
                            'evaluation_id' => $evaluation->id,
                            'student_id' => $student->id,
                            'submitted_at' => now(),
                            'is_anonymous' => true,
                            'submission_hash' => hash('sha256', $student->id . $evaluation->id . time() . rand()),
                        ]);
                        
                        // Create feedback
                        $feedback = Feedback::create([
                            'evaluation_id' => $evaluation->id,
                            'student_id' => $student->id,
                            'anonymous' => true,
                            'submission_id' => $submission->id,
                            'is_locked' => true,
                        ]);
                        
                        // Create responses with some variation based on course difficulty
                        foreach ($questions as $question) {
                            // Use fixed ratings to make test predictable
                            $rating = $this->faker->numberBetween(3, 5);
                            
                            Response::create([
                                'feedback_id' => $feedback->id,
                                'question_id' => $question->id,
                                'rating' => $rating,
                                'text' => $this->faker->sentence(),
                            ]);
                            
                            $evaluationRatings[] = $rating;
                        }
                    }
                    
                    // Calculate performance score for this evaluation
                    $avgRating = count($evaluationRatings) > 0 ? array_sum($evaluationRatings) / count($evaluationRatings) : 0;
                    $performanceScore = $avgRating > 0 ? ($avgRating / 5) * 100 : 0;
                    
                    $teacherCourses[] = [
                        'course_id' => $course->id,
                        'year_level' => $yearLevel,
                        'population_size' => $populationSize,
                        'performance_score' => round($performanceScore, 2),
                    ];
                    
                    $totalPerformance += $performanceScore;
                    $totalEvaluations++;
                }
                
                $expectedTeacherStats[$teacher->id] = [
                    'teacher_id' => $teacher->id,
                    'raw_performance_score' => $totalEvaluations > 0 ? round($totalPerformance / $totalEvaluations, 2) : 0,
                    'total_evaluations' => $totalEvaluations,
                    'courses' => $teacherCourses,
                ];
            }
            
            // Get fair comparison from service
            $comparison = $this->service->compareFairTeacherPerformance($teacherIds, $period);
            
            // Property: Comparison should include all requested teachers
            $this->assertEquals($period, $comparison['period'], 
                "Comparison should include correct period");
            $this->assertCount($numTeachers, $comparison['teacher_comparisons'], 
                "Comparison should include all teachers");
            
            // Property: Each teacher should have both raw and adjusted scores
            foreach ($comparison['teacher_comparisons'] as $teacherData) {
                $teacherId = $teacherData['teacher_id'];
                $this->assertContains($teacherId, $teacherIds, 
                    "Teacher ID should be in requested list");
                
                // Property: Required fields should be present
                $this->assertArrayHasKey('raw_performance_score', $teacherData, 
                    "Teacher data should include raw performance score");
                $this->assertArrayHasKey('adjusted_performance_score', $teacherData, 
                    "Teacher data should include adjusted performance score");
                $this->assertArrayHasKey('course_difficulty_factor', $teacherData, 
                    "Teacher data should include course difficulty factor");
                $this->assertArrayHasKey('student_population_factor', $teacherData, 
                    "Teacher data should include student population factor");
                
                // Property: Adjustment factors should be reasonable
                $this->assertGreaterThan(0, $teacherData['course_difficulty_factor'], 
                    "Course difficulty factor should be positive");
                $this->assertGreaterThan(0, $teacherData['student_population_factor'], 
                    "Student population factor should be positive");
                $this->assertLessThan(2, $teacherData['course_difficulty_factor'], 
                    "Course difficulty factor should be reasonable");
                $this->assertGreaterThan(0.5, $teacherData['student_population_factor'], 
                    "Student population factor should be reasonable");
                
                // Property: Performance scores should be within valid range
                $this->assertGreaterThanOrEqual(0, $teacherData['raw_performance_score'], 
                    "Raw performance score should be >= 0");
                $this->assertLessThanOrEqual(100, $teacherData['raw_performance_score'], 
                    "Raw performance score should be <= 100");
                $this->assertGreaterThanOrEqual(0, $teacherData['adjusted_performance_score'], 
                    "Adjusted performance score should be >= 0");
            }
            
            // Property: Teachers should be sorted by adjusted performance score (descending)
            $adjustedScores = array_column($comparison['teacher_comparisons'], 'adjusted_performance_score');
            $sortedScores = $adjustedScores;
            rsort($sortedScores);
            $this->assertEquals($sortedScores, $adjustedScores, 
                "Teachers should be sorted by adjusted performance score (descending)");
            
            // Property: Comparison methodology should be documented
            $this->assertArrayHasKey('comparison_methodology', $comparison, 
                "Comparison should document methodology");
            $methodology = $comparison['comparison_methodology'];
            $this->assertTrue($methodology['accounts_for_course_difficulty'], 
                "Methodology should account for course difficulty");
            $this->assertTrue($methodology['accounts_for_student_population'], 
                "Methodology should account for student population");
            $this->assertTrue($methodology['normalization_applied'], 
                "Methodology should apply normalization");
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 28: Significant Trend Detection**
     * For any performance trend analysis, significant improvements or declines 
     * should be correctly identified and highlighted
     * **Validates: Requirements 6.4**
     */
    public function test_significant_trend_detection_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Create performance data with known significant changes
            $dataPoints = $this->faker->numberBetween(4, 10);
            $performanceData = [];
            $expectedSignificantChanges = [];
            
            $baseScore = $this->faker->numberBetween(60, 80);
            $significanceThreshold = 5.0; // Fixed threshold for predictable testing
            
            // Generate data with some intentional significant changes
            for ($j = 0; $j < $dataPoints; $j++) {
                if ($j === 0) {
                    $score = $baseScore;
                } else {
                    // Randomly decide if this should be a significant change
                    $shouldBeSignificant = $this->faker->boolean(30); // 30% chance
                    
                    if ($shouldBeSignificant) {
                        // Create a significant change (above threshold)
                        $changeDirection = $this->faker->boolean() ? 1 : -1;
                        $changeAmount = $this->faker->numberBetween(6, 15); // Above threshold
                        $score = $performanceData[$j - 1] + ($changeDirection * $changeAmount);
                        
                        $expectedSignificantChanges[] = [
                            'period_from' => $j - 1,
                            'period_to' => $j,
                            'change' => $changeDirection * $changeAmount,
                            'type' => $changeDirection > 0 ? 'improvement' : 'decline',
                        ];
                    } else {
                        // Create a non-significant change (below threshold)
                        $changeAmount = $this->faker->numberBetween(-4, 4); // Below threshold
                        $score = $performanceData[$j - 1] + $changeAmount;
                    }
                }
                
                $performanceData[] = max(10, min(100, $score)); // Clamp to reasonable range
            }
            
            // Analyze trends
            $trendAnalysis = $this->service->detectSignificantTrends($performanceData, $significanceThreshold);
            
            // Property: All detected trends should meet significance threshold
            foreach ($trendAnalysis['significant_trends'] as $trend) {
                $this->assertGreaterThanOrEqual($significanceThreshold, abs($trend['change']), 
                    "Detected trend change should meet significance threshold");
                
                // Property: Trend type should match change direction
                if ($trend['change'] > 0) {
                    $this->assertEquals('improvement', $trend['trend_type'], 
                        "Positive change should be classified as improvement");
                } else {
                    $this->assertEquals('decline', $trend['trend_type'], 
                        "Negative change should be classified as decline");
                }
                
                // Property: Period indices should be valid and consecutive
                $this->assertGreaterThanOrEqual(0, $trend['period_from'], 
                    "Period from should be valid");
                $this->assertLessThan($dataPoints, $trend['period_to'], 
                    "Period to should be valid");
                $this->assertEquals($trend['period_from'] + 1, $trend['period_to'], 
                    "Periods should be consecutive");
                
                // Property: Change percentage should be calculated correctly
                $expectedPercentage = $performanceData[$trend['period_from']] > 0 
                    ? ($trend['change'] / $performanceData[$trend['period_from']]) * 100 
                    : 0;
                $this->assertEquals(round($expectedPercentage, 2), $trend['change_percentage'], 
                    "Change percentage should be calculated correctly");
                
                // Property: Significance level should be appropriate for change magnitude
                $changeRatio = abs($trend['change']) / $significanceThreshold;
                if ($changeRatio >= 3) {
                    $this->assertEquals('very_high', $trend['significance_level'], 
                        "Very large changes should have very_high significance");
                } elseif ($changeRatio >= 2) {
                    $this->assertEquals('high', $trend['significance_level'], 
                        "Large changes should have high significance");
                } elseif ($changeRatio >= 1.5) {
                    $this->assertEquals('moderate', $trend['significance_level'], 
                        "Moderate changes should have moderate significance");
                } else {
                    $this->assertEquals('low', $trend['significance_level'], 
                        "Small changes should have low significance");
                }
            }
            
            // Property: Number of detected trends should not exceed possible transitions
            $maxPossibleTrends = $dataPoints - 1;
            $this->assertLessThanOrEqual($maxPossibleTrends, count($trendAnalysis['significant_trends']), 
                "Number of trends should not exceed possible transitions");
            
            // Property: Overall trend should reflect the general direction
            $firstScore = $performanceData[0];
            $lastScore = $performanceData[$dataPoints - 1];
            $overallChange = $lastScore - $firstScore;
            
            if (abs($overallChange) > $significanceThreshold && $trendAnalysis['trend_strength'] > 50) {
                if ($overallChange > 0) {
                    $this->assertEquals('improving', $trendAnalysis['overall_trend'], 
                        "Overall improving trend should be detected");
                } else {
                    $this->assertEquals('declining', $trendAnalysis['overall_trend'], 
                        "Overall declining trend should be detected");
                }
            }
            
            // Property: Trend strength should correlate with R-squared
            $linearTrend = $trendAnalysis['linear_trend'];
            $expectedTrendStrength = round($linearTrend['r_squared'] * 100, 2);
            $this->assertEquals($expectedTrendStrength, $trendAnalysis['trend_strength'], 
                "Trend strength should equal R-squared * 100");
            
            // Property: All required analysis fields should be present
            $this->assertArrayHasKey('significant_trends', $trendAnalysis);
            $this->assertArrayHasKey('overall_trend', $trendAnalysis);
            $this->assertArrayHasKey('trend_strength', $trendAnalysis);
            $this->assertArrayHasKey('linear_trend', $trendAnalysis);
            $this->assertArrayHasKey('total_periods_analyzed', $trendAnalysis);
            $this->assertArrayHasKey('significance_threshold', $trendAnalysis);
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 29: Department Benchmarking Accuracy**
     * For any department performance analysis, aggregate statistics and benchmarking 
     * against previous periods should be accurate
     * **Validates: Requirements 6.5**
     */
    public function test_department_benchmarking_accuracy_property()
    {
        // Run property test with 50 iterations (reduced to avoid unique constraint issues)
        for ($i = 0; $i < 50; $i++) {
            // Reset faker unique generator to avoid overflow
            $this->faker = Faker::create();
            
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->lexify('???')) . $i . time()
            ]);
            
            // Create benchmarking across multiple periods
            $periods = ['2023-1', '2023-2', '2024-1'];
            $expectedBenchmarkData = [];
            
            foreach ($periods as $periodIndex => $period) {
                [$year, $semester] = explode('-', $period);
                
                // Create multiple courses and teachers for this period
                $numCourses = $this->faker->numberBetween(2, 3);
                $periodEvaluations = [];
                $periodTeachers = [];
                $periodCourses = [];
                $totalPerformanceScore = 0;
                $totalParticipationRate = 0;
                $totalResponses = 0;
                $performanceDistribution = [
                    'excellent' => 0,
                    'good' => 0,
                    'satisfactory' => 0,
                    'needs_improvement' => 0,
                ];
                
                for ($j = 0; $j < $numCourses; $j++) {
                    $course = Course::factory()->create([
                        'department_id' => $department->id,
                        'code' => strtoupper($this->faker->lexify('???')) . $i . $periodIndex . $j . time()
                    ]);
                    $teacher = Teacher::factory()->create(['department_id' => $department->id]);
                    
                    $evaluation = Evaluation::create([
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $year,
                        'semester' => $semester,
                        'year_level' => $this->faker->numberBetween(1, 4),
                        'opened_at' => now()->subDays(30),
                        'closed_at' => now()->subDays(10),
                    ]);
                    
                    // Create students and responses
                    $numStudents = $this->faker->numberBetween(10, 15);
                    $students = Student::factory()->count($numStudents)->create(['department_id' => $department->id]);
                    
                    // Enroll students in course
                    foreach ($students as $student) {
                        $student->courses()->attach($course->id);
                    }
                    
                    // Create questions
                    $questions = Question::factory()->count(3)->create();
                    
                    $evaluationRatings = [];
                    $evaluationResponses = 0;
                    
                    foreach ($students as $student) {
                        // Create submission
                        $submission = EvaluationSubmission::create([
                            'evaluation_id' => $evaluation->id,
                            'student_id' => $student->id,
                            'submitted_at' => now(),
                            'is_anonymous' => true,
                            'submission_hash' => hash('sha256', $student->id . $evaluation->id . time() . rand()),
                        ]);
                        
                        // Create feedback
                        $feedback = Feedback::create([
                            'evaluation_id' => $evaluation->id,
                            'student_id' => $student->id,
                            'anonymous' => true,
                            'submission_id' => $submission->id,
                            'is_locked' => true,
                        ]);
                        
                        // Create responses
                        foreach ($questions as $question) {
                            $rating = $this->faker->numberBetween(1, 5);
                            Response::create([
                                'feedback_id' => $feedback->id,
                                'question_id' => $question->id,
                                'rating' => $rating,
                                'text' => $this->faker->sentence(),
                            ]);
                            
                            $evaluationRatings[] = $rating;
                            $evaluationResponses++;
                        }
                    }
                    
                    // Calculate performance score
                    $avgRating = count($evaluationRatings) > 0 ? array_sum($evaluationRatings) / count($evaluationRatings) : 0;
                    $performanceScore = $avgRating > 0 ? ($avgRating / 5) * 100 : 0;
                    $participationRate = 100; // 100% participation in test
                    
                    $totalPerformanceScore += $performanceScore;
                    $totalParticipationRate += $participationRate;
                    $totalResponses += $evaluationResponses;
                    
                    // Categorize performance
                    if ($performanceScore >= 90) {
                        $performanceDistribution['excellent']++;
                    } elseif ($performanceScore >= 80) {
                        $performanceDistribution['good']++;
                    } elseif ($performanceScore >= 70) {
                        $performanceDistribution['satisfactory']++;
                    } else {
                        $performanceDistribution['needs_improvement']++;
                    }
                    
                    $periodEvaluations[] = $evaluation->id;
                    $periodTeachers[] = $teacher->id;
                    $periodCourses[] = $course->id;
                }
                
                $expectedBenchmarkData[$period] = [
                    'period' => $period,
                    'academic_year' => $year,
                    'semester' => $semester,
                    'total_evaluations' => count($periodEvaluations),
                    'average_performance_score' => count($periodEvaluations) > 0 ? round($totalPerformanceScore / count($periodEvaluations), 2) : 0,
                    'average_participation_rate' => count($periodEvaluations) > 0 ? round($totalParticipationRate / count($periodEvaluations), 2) : 0,
                    'total_responses' => $totalResponses,
                    'teacher_count' => count(array_unique($periodTeachers)),
                    'course_count' => count(array_unique($periodCourses)),
                    'performance_distribution' => $performanceDistribution,
                ];
            }
            
            // Get department benchmarking from service
            $benchmarking = $this->service->generateDepartmentBenchmarking($department->id, $periods);
            
            // Property: Benchmarking should include all requested periods
            $this->assertEquals($department->id, $benchmarking['department_id'], 
                "Benchmarking should include correct department ID");
            $this->assertEquals($periods, $benchmarking['periods'], 
                "Benchmarking should include all requested periods");
            
            // Property: Each period's benchmark data should be accurate
            foreach ($benchmarking['benchmark_data'] as $periodData) {
                $period = $periodData['period'];
                $expected = $expectedBenchmarkData[$period];
                
                $this->assertEquals($expected['academic_year'], $periodData['academic_year'], 
                    "Academic year should match for period {$period}");
                $this->assertEquals($expected['semester'], $periodData['semester'], 
                    "Semester should match for period {$period}");
                $this->assertEquals($expected['total_evaluations'], $periodData['total_evaluations'], 
                    "Total evaluations should match for period {$period}");
                $this->assertEqualsWithDelta($expected['average_performance_score'], $periodData['average_performance_score'], 0.1,
                    "Average performance score should match for period {$period}");
                $this->assertEquals($expected['total_responses'], $periodData['total_responses'], 
                    "Total responses should match for period {$period}");
                $this->assertEquals($expected['teacher_count'], $periodData['teacher_count'], 
                    "Teacher count should match for period {$period}");
                $this->assertEquals($expected['course_count'], $periodData['course_count'], 
                    "Course count should match for period {$period}");
                
                // Property: Performance distribution should be accurate
                foreach (['excellent', 'good', 'satisfactory', 'needs_improvement'] as $category) {
                    $expectedCount = $expected['performance_distribution'][$category];
                    $actualData = $periodData['performance_distribution'][$category];
                    
                    $this->assertEquals($expectedCount, $actualData['count'], 
                        "Performance distribution count for {$category} should match for period {$period}");
                    
                    $expectedPercentage = $expected['total_evaluations'] > 0 
                        ? round(($expectedCount / $expected['total_evaluations']) * 100, 2) 
                        : 0;
                    $this->assertEquals($expectedPercentage, $actualData['percentage'], 
                        "Performance distribution percentage for {$category} should match for period {$period}");
                }
            }
            
            // Property: Period-over-period changes should be calculated correctly
            if (count($periods) > 1) {
                $this->assertArrayHasKey('period_changes', $benchmarking, 
                    "Benchmarking should include period changes");
                
                $expectedChanges = count($periods) - 1;
                $this->assertCount($expectedChanges, $benchmarking['period_changes'], 
                    "Should have correct number of period changes");
                
                foreach ($benchmarking['period_changes'] as $changeIndex => $change) {
                    $fromPeriod = $periods[$changeIndex];
                    $toPeriod = $periods[$changeIndex + 1];
                    
                    $this->assertEquals($fromPeriod, $change['from_period'], 
                        "From period should match");
                    $this->assertEquals($toPeriod, $change['to_period'], 
                        "To period should match");
                    
                    // Verify change calculations
                    $fromData = $expectedBenchmarkData[$fromPeriod];
                    $toData = $expectedBenchmarkData[$toPeriod];
                    
                    $expectedPerformanceChange = $toData['average_performance_score'] - $fromData['average_performance_score'];
                    $this->assertEqualsWithDelta($expectedPerformanceChange, $change['performance_change'], 0.1,
                        "Performance change should be calculated correctly");
                    
                    $expectedEvaluationChange = $toData['total_evaluations'] - $fromData['total_evaluations'];
                    $this->assertEquals($expectedEvaluationChange, $change['evaluation_count_change'], 
                        "Evaluation count change should be calculated correctly");
                }
            }
            
            // Property: Overall trend should be provided
            $this->assertArrayHasKey('overall_trend', $benchmarking, 
                "Benchmarking should include overall trend");
            $overallTrend = $benchmarking['overall_trend'];
            
            $this->assertArrayHasKey('trend_direction', $overallTrend, 
                "Overall trend should include direction");
            $this->assertContains($overallTrend['trend_direction'], 
                ['improving', 'declining', 'stable', 'insufficient_data'], 
                "Trend direction should be valid");
            
            // Property: Generated timestamp should be recent
            $this->assertInstanceOf(Carbon::class, $benchmarking['generated_at'], 
                "Generated timestamp should be Carbon instance");
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 13: Department Aggregation Accuracy**
     * For any department-wide report, data should be correctly aggregated across all teachers 
     * with accurate ranking and performance insights
     * **Validates: Requirements 3.4**
     */
    public function test_department_aggregation_accuracy_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            
            // Create random number of teachers and courses
            $numTeachers = $this->faker->numberBetween(2, 6);
            $numCourses = $this->faker->numberBetween(2, 8);
            
            $teachers = Teacher::factory()->count($numTeachers)->create(['department_id' => $department->id]);
            $courses = Course::factory()->count($numCourses)->create(['department_id' => $department->id]);
            
            // Pre-create and enroll students in courses to ensure consistent participation calculation
            $courseStudentMap = [];
            foreach ($courses as $course) {
                $numStudentsInCourse = $this->faker->numberBetween(10, 30);
                $studentsForCourse = Student::factory()->count($numStudentsInCourse)->create(['department_id' => $department->id]);
                
                // Enroll all students in this course
                foreach ($studentsForCourse as $student) {
                    $student->courses()->attach($course->id);
                }
                
                $courseStudentMap[$course->id] = $studentsForCourse;
            }
            
            // Create evaluations for random teacher-course combinations
            $evaluations = [];
            $expectedTeacherData = [];
            $allPerformanceScores = [];
            $allParticipationRates = [];
            $totalResponses = 0;
            
            $academicYear = $this->faker->year();
            $semester = $this->faker->numberBetween(1, 2);
            $period = "{$academicYear}-{$semester}";
            
            // Create 3-10 evaluations per department
            $numEvaluations = $this->faker->numberBetween(3, 10);
            
            for ($j = 0; $j < $numEvaluations; $j++) {
                $teacher = $this->faker->randomElement($teachers);
                $course = $this->faker->randomElement($courses);
                
                $evaluation = Evaluation::create([
                    'course_id' => $course->id,
                    'teacher_id' => $teacher->id,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'year_level' => $this->faker->numberBetween(1, 4),
                    'opened_at' => now()->subDays(20),
                    'closed_at' => now()->subDays(5),
                ]);
                
                $evaluations[] = $evaluation;
                
                // Get the pre-enrolled students for this course
                $enrolledStudents = $courseStudentMap[$course->id];
                $totalEligibleStudents = count($enrolledStudents);
                
                // Create submissions for random percentage of enrolled students
                $participationRate = $this->faker->numberBetween(40, 95);
                $numSubmissions = intval(($participationRate / 100) * $totalEligibleStudents);
                $submittingStudents = $enrolledStudents->take($numSubmissions);
                
                // Create questions
                $questions = Question::factory()->count(3)->create();
                
                $evaluationRatings = [];
                $evaluationResponses = 0;
                
                foreach ($submittingStudents as $student) {
                    // Create submission
                    $submission = EvaluationSubmission::create([
                        'evaluation_id' => $evaluation->id,
                        'student_id' => $student->id,
                        'submitted_at' => now()->subDays($this->faker->numberBetween(1, 15)),
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
                        
                        $evaluationRatings[] = $rating;
                        $evaluationResponses++;
                    }
                }
                
                // Calculate expected values for this evaluation
                $avgRating = count($evaluationRatings) > 0 ? array_sum($evaluationRatings) / count($evaluationRatings) : 0;
                $performanceScore = $avgRating > 0 ? ($avgRating / 5) * 100 : 0;
                $actualParticipationRate = ($numSubmissions / $totalEligibleStudents) * 100;
                
                $allPerformanceScores[] = $performanceScore;
                $allParticipationRates[] = $actualParticipationRate;
                $totalResponses += $evaluationResponses;
                
                // Track expected teacher data
                $teacherId = $teacher->id;
                if (!isset($expectedTeacherData[$teacherId])) {
                    $expectedTeacherData[$teacherId] = [
                        'teacher_name' => $teacher->name,
                        'evaluations' => [],
                        'performance_scores' => [],
                        'participation_rates' => [],
                        'total_responses' => 0,
                        'courses' => [],
                    ];
                }
                
                $expectedTeacherData[$teacherId]['evaluations'][] = $evaluation->id;
                $expectedTeacherData[$teacherId]['performance_scores'][] = $performanceScore;
                $expectedTeacherData[$teacherId]['participation_rates'][] = $actualParticipationRate;
                $expectedTeacherData[$teacherId]['total_responses'] += $evaluationResponses;
                $expectedTeacherData[$teacherId]['courses'][] = $course->code;
            }
            
            // Get department aggregation from service
            $aggregation = $this->service->generateDepartmentAggregation($department->id, $period);
            
            // Property: Basic structure should be correct
            $this->assertEquals($department->id, $aggregation['department_id'], 
                "Department ID should match");
            $this->assertEquals($period, $aggregation['period'], 
                "Period should match");
            $this->assertEquals($academicYear, $aggregation['academic_year'], 
                "Academic year should match");
            $this->assertEquals($semester, $aggregation['semester'], 
                "Semester should match");
            
            // Property: Department statistics should be accurate
            $deptStats = $aggregation['department_statistics'];
            
            $this->assertEquals(count($expectedTeacherData), $deptStats['total_teachers'], 
                "Total teachers should match unique teacher count");
            $this->assertEquals(count($evaluations), $deptStats['total_evaluations'], 
                "Total evaluations should match");
            $this->assertEquals($totalResponses, $deptStats['total_responses'], 
                "Total responses should match");
            
            // Calculate expected department averages
            $expectedAvgPerformance = count($allPerformanceScores) > 0 ? 
                array_sum($allPerformanceScores) / count($allPerformanceScores) : 0;
            $expectedAvgParticipation = count($allParticipationRates) > 0 ? 
                array_sum($allParticipationRates) / count($allParticipationRates) : 0;
            
            $this->assertEqualsWithDelta($expectedAvgPerformance, $deptStats['average_performance_score'], 0.1,
                "Department average performance should be calculated correctly");
            $this->assertEqualsWithDelta($expectedAvgParticipation, $deptStats['average_participation_rate'], 0.1,
                "Department average participation should be calculated correctly");
            
            // Property: Teacher rankings should be accurate
            $teacherRankings = $aggregation['teacher_rankings'];
            $this->assertCount(count($expectedTeacherData), $teacherRankings, 
                "Should have ranking for each teacher");
            
            foreach ($teacherRankings as $ranking) {
                $teacherId = $ranking['teacher_id'];
                $this->assertArrayHasKey($teacherId, $expectedTeacherData, 
                    "Teacher should exist in expected data");
                
                $expected = $expectedTeacherData[$teacherId];
                
                // Property: Teacher averages should be calculated correctly
                $expectedAvgPerf = count($expected['performance_scores']) > 0 ? 
                    array_sum($expected['performance_scores']) / count($expected['performance_scores']) : 0;
                $expectedAvgPart = count($expected['participation_rates']) > 0 ? 
                    array_sum($expected['participation_rates']) / count($expected['participation_rates']) : 0;
                
                $this->assertEqualsWithDelta($expectedAvgPerf, $ranking['average_performance_score'], 0.1,
                    "Teacher average performance should be calculated correctly for teacher {$teacherId}");
                $this->assertEqualsWithDelta($expectedAvgPart, $ranking['average_participation_rate'], 0.1,
                    "Teacher average participation should be calculated correctly for teacher {$teacherId}");
                
                // Property: Teacher evaluation count should match
                $this->assertEquals(count($expected['evaluations']), $ranking['total_evaluations'], 
                    "Teacher evaluation count should match for teacher {$teacherId}");
                
                // Property: Teacher response count should match
                $this->assertEquals($expected['total_responses'], $ranking['total_responses'], 
                    "Teacher response count should match for teacher {$teacherId}");
                
                // Property: Ranking should have required fields
                $this->assertArrayHasKey('rank', $ranking, "Ranking should have rank field");
                $this->assertArrayHasKey('performance_insights', $ranking, "Ranking should have insights");
                $this->assertArrayHasKey('courses_taught', $ranking, "Ranking should have courses");
                $this->assertArrayHasKey('course_count', $ranking, "Ranking should have course count");
                
                // Property: Rank should be valid (1 to number of teachers)
                $this->assertGreaterThanOrEqual(1, $ranking['rank'], 
                    "Rank should be >= 1");
                $this->assertLessThanOrEqual(count($expectedTeacherData), $ranking['rank'], 
                    "Rank should be <= total teachers");
                
                // Property: Performance insights should be array
                $this->assertIsArray($ranking['performance_insights'], 
                    "Performance insights should be array");
            }
            
            // Property: Rankings should be sorted by performance score (descending)
            for ($k = 1; $k < count($teacherRankings); $k++) {
                $this->assertGreaterThanOrEqual(
                    $teacherRankings[$k]['average_performance_score'],
                    $teacherRankings[$k-1]['average_performance_score'],
                    "Rankings should be sorted by performance score (descending)"
                );
            }
            
            // Property: Ranks should be sequential (1, 2, 3, ...)
            foreach ($teacherRankings as $index => $ranking) {
                $this->assertEquals($index + 1, $ranking['rank'], 
                    "Ranks should be sequential starting from 1");
            }
            
            // Property: Performance distribution should be provided
            $this->assertArrayHasKey('performance_distribution', $aggregation, 
                "Should include performance distribution");
            $distribution = $aggregation['performance_distribution'];
            
            $this->assertArrayHasKey('distribution', $distribution, 
                "Should have distribution breakdown");
            $this->assertArrayHasKey('statistics', $distribution, 
                "Should have statistical measures");
            
            // Property: Distribution counts should sum to total evaluations
            $distCounts = array_sum(array_column($distribution['distribution'], 'count'));
            $this->assertEquals(count($evaluations), $distCounts, 
                "Distribution counts should sum to total evaluations");
            
            // Property: Distribution percentages should sum to 100%
            $distPercentages = array_sum(array_column($distribution['distribution'], 'percentage'));
            $this->assertEqualsWithDelta(100.0, $distPercentages, 0.1, 
                "Distribution percentages should sum to 100%");
            
            // Property: Comparative analysis should be provided
            $this->assertArrayHasKey('comparative_analysis', $aggregation, 
                "Should include comparative analysis");
            $analysis = $aggregation['comparative_analysis'];
            
            $this->assertArrayHasKey('top_performers', $analysis, 
                "Should identify top performers");
            $this->assertArrayHasKey('improvement_needed', $analysis, 
                "Should identify teachers needing improvement");
            $this->assertArrayHasKey('performance_gaps', $analysis, 
                "Should analyze performance gaps");
            $this->assertArrayHasKey('recommendations', $analysis, 
                "Should provide recommendations");
            
            // Property: Generated timestamp should be recent
            $this->assertInstanceOf(Carbon::class, $aggregation['generated_at'], 
                "Generated timestamp should be Carbon instance");
        }
    }

    /**
     * **Feature: teacher-evaluation-system, Property 9: Ranking order correctness**
     * For any set of teachers with calculated weighted scores, the ranking should order them from highest to lowest final score
     * **Validates: Requirements 6.5**
     */
    public function test_ranking_order_correctness_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique department code
            $department = Department::factory()->create([
                'code' => strtoupper($this->faker->unique()->lexify('???')) . $i
            ]);
            
            // Create multiple teachers with different performance levels
            $numTeachers = $this->faker->numberBetween(3, 8);
            $teachers = [];
            $expectedScores = [];
            
            for ($t = 0; $t < $numTeachers; $t++) {
                $teacher = Teacher::factory()->create(['department_id' => $department->id]);
                $teachers[] = $teacher;
                
                // Create course for this teacher
                $course = Course::factory()->create(['department_id' => $department->id]);
                
                // Create evaluation for this teacher
                $evaluation = Evaluation::factory()->create([
                    'teacher_id' => $teacher->id,
                    'course_id' => $course->id,
                    'academic_year' => '2024',
                    'semester' => '1'
                ]);
                
                // Create students and enroll them in the course
                $numStudents = $this->faker->numberBetween(10, 30);
                $students = Student::factory()->count($numStudents)->create([
                    'department_id' => $department->id
                ]);
                
                foreach ($students as $student) {
                    $student->courses()->attach($course->id);
                }
                
                // Create questions for the evaluation
                $questions = Question::factory()->count(5)->create();
                
                // Attach questions to evaluation
                foreach ($questions as $question) {
                    $evaluation->questions()->attach($question->id);
                }
                
                // Generate responses with known average rating to control performance score
                $targetRating = $this->faker->randomFloat(2, 1.0, 5.0);
                $totalRating = 0;
                $responseCount = 0;
                
                // Create submissions for a subset of students
                $numSubmissions = $this->faker->numberBetween(5, $numStudents);
                $submittingStudents = $students->random($numSubmissions);
                
                foreach ($submittingStudents as $student) {
                    // Create submission first
                    $submission = EvaluationSubmission::factory()->create([
                        'evaluation_id' => $evaluation->id,
                        'student_id' => $student->id,
                        'submission_hash' => hash('sha256', $student->id . $evaluation->id . time() . $i . $t),
                    ]);
                    
                    // Create feedback linked to submission
                    $feedback = Feedback::factory()->create([
                        'evaluation_id' => $evaluation->id,
                        'student_id' => $student->id,
                        'anonymous' => $this->faker->boolean(),
                        'submission_id' => $submission->id
                    ]);
                    
                    foreach ($questions as $question) {
                        // Generate rating close to target with some variance
                        $rating = max(1, min(5, $targetRating + $this->faker->randomFloat(2, -0.5, 0.5)));
                        
                        Response::factory()->create([
                            'feedback_id' => $feedback->id,
                            'question_id' => $question->id,
                            'rating' => $rating
                        ]);
                        
                        $totalRating += $rating;
                        $responseCount++;
                    }
                }
                
                // Calculate expected performance score for this teacher
                $avgRating = $responseCount > 0 ? $totalRating / $responseCount : 0;
                $performanceScore = $avgRating > 0 ? ($avgRating / 5) * 100 : 0;
                $expectedScores[$teacher->id] = round($performanceScore, 2);
            }
            
            // Get department aggregation from service
            $period = '2024-1';
            $aggregation = $this->service->generateDepartmentAggregation($department->id, $period);
            
            // Property: Rankings should exist and have correct structure
            $this->assertArrayHasKey('teacher_rankings', $aggregation, 
                "Aggregation should contain teacher rankings");
            
            $rankings = $aggregation['teacher_rankings'];
            $this->assertCount($numTeachers, $rankings, 
                "Should have ranking for each teacher");
            
            // Property: Rankings should be ordered by performance score (descending)
            for ($j = 1; $j < count($rankings); $j++) {
                $this->assertGreaterThanOrEqual(
                    $rankings[$j]['average_performance_score'],
                    $rankings[$j-1]['average_performance_score'],
                    "Teacher at rank {$rankings[$j-1]['rank']} should have performance score >= teacher at rank {$rankings[$j]['rank']}"
                );
            }
            
            // Property: Rank values should be sequential starting from 1
            foreach ($rankings as $index => $ranking) {
                $this->assertEquals($index + 1, $ranking['rank'], 
                    "Rank should be sequential: position {$index} should have rank " . ($index + 1));
            }
            
            // Property: Highest scoring teacher should have rank 1
            if (count($rankings) > 0) {
                $highestScore = max(array_column($rankings, 'average_performance_score'));
                $topRankedTeacher = array_filter($rankings, function($r) { return $r['rank'] === 1; });
                $topRankedTeacher = reset($topRankedTeacher);
                
                $this->assertEquals(1, $topRankedTeacher['rank'], 
                    "Top performer should have rank 1");
                $this->assertEquals($highestScore, $topRankedTeacher['average_performance_score'], 
                    "Teacher with rank 1 should have the highest performance score");
            }
            
            // Property: Lowest scoring teacher should have the highest rank number
            if (count($rankings) > 1) {
                $lowestScore = min(array_column($rankings, 'average_performance_score'));
                $lowestRankedTeacher = array_filter($rankings, function($r) use ($numTeachers) { 
                    return $r['rank'] === $numTeachers; 
                });
                $lowestRankedTeacher = reset($lowestRankedTeacher);
                
                $this->assertEquals($numTeachers, $lowestRankedTeacher['rank'], 
                    "Lowest performer should have the highest rank number");
                $this->assertEquals($lowestScore, $lowestRankedTeacher['average_performance_score'], 
                    "Teacher with highest rank number should have the lowest performance score");
            }
            
            // Property: No two teachers should have the same rank
            $ranks = array_column($rankings, 'rank');
            $uniqueRanks = array_unique($ranks);
            $this->assertCount(count($ranks), $uniqueRanks, 
                "All ranks should be unique - no ties in ranking positions");
            
            // Property: All ranks should be within valid range
            foreach ($rankings as $ranking) {
                $this->assertGreaterThanOrEqual(1, $ranking['rank'], 
                    "Rank should be >= 1");
                $this->assertLessThanOrEqual($numTeachers, $ranking['rank'], 
                    "Rank should be <= total number of teachers");
            }
            
            // Property: Rankings should preserve teacher identity correctly
            foreach ($rankings as $ranking) {
                $this->assertArrayHasKey('teacher_id', $ranking, 
                    "Ranking should contain teacher_id");
                $this->assertArrayHasKey('teacher_name', $ranking, 
                    "Ranking should contain teacher_name");
                $this->assertArrayHasKey('average_performance_score', $ranking, 
                    "Ranking should contain average_performance_score");
                
                // Verify teacher exists in our created teachers
                $teacherExists = false;
                foreach ($teachers as $teacher) {
                    if ($teacher->id === $ranking['teacher_id']) {
                        $teacherExists = true;
                        $this->assertEquals($teacher->name, $ranking['teacher_name'], 
                            "Teacher name should match for teacher {$teacher->id}");
                        break;
                    }
                }
                $this->assertTrue($teacherExists, 
                    "Ranked teacher {$ranking['teacher_id']} should exist in created teachers");
            }
        }
    }
}