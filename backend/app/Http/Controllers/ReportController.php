<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAnalytics;
use App\Models\Teacher;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function stats(Request $request)
    {
        $departmentId = $request->query('department_id');
        $semester = $request->query('semester');
        $year = $request->query('year');

        // Base queries
        $analyticsQuery = EvaluationAnalytics::query();
        $evaluationsQuery = Evaluation::query();
        
        if ($departmentId) {
            $analyticsQuery->whereHas('evaluation.teacher', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
            $evaluationsQuery->whereHas('teacher', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if ($semester && $semester !== 'all') {
            $evaluationsQuery->where('semester', $semester);
            $analyticsQuery->whereHas('evaluation', function($q) use ($semester) {
                $q->where('semester', $semester);
            });
        }

        if ($year && $year !== 'all') {
            $evaluationsQuery->where('academic_year', 'like', $year . '%');
            $analyticsQuery->whereHas('evaluation', function($q) use ($year) {
                $q->where('academic_year', 'like', $year . '%');
            });
        }

        // Calculate stats
        $totalEvaluations = $evaluationsQuery->count();
        
        // Calculate average rating from analytics
        $averageRating = $analyticsQuery->avg('average_rating') ?? 0;
        
        // Calculate participation rate (previously completionRate)
        $participationRate = $analyticsQuery->avg('participation_rate') ?? 0;

        // Pending reports (Evaluations that are not closed)
        $pendingReports = $evaluationsQuery->clone()
            ->where(function($q) {
                $q->whereNull('closed_at')
                  ->orWhere('closed_at', '>', now());
            })
            ->count();

        return response()->json([
            'totalEvaluations' => $totalEvaluations,
            'averageRating' => round($averageRating, 1),
            'participationRate' => round($participationRate, 1),
            'pendingReports' => $pendingReports,
        ]);
    }

    public function charts(Request $request)
    {
        $departmentId = $request->query('department_id');
        $semester = $request->query('semester');
        $year = $request->query('year');

        // Evaluation Trends Chart (evaluations count and avg rating per month)
        $trendsQuery = DB::table('evaluation_analytics')
            ->join('evaluations', 'evaluation_analytics.evaluation_id', '=', 'evaluations.id')
            ->select(
                DB::raw("DATE_FORMAT(evaluation_analytics.calculated_at, '%Y-%m') as name"), 
                DB::raw('COUNT(*) as evaluations'),
                DB::raw('AVG(evaluation_analytics.average_rating) as rating')
            )
            ->groupBy('name')
            ->orderBy('name');

        if ($departmentId) {
            $trendsQuery->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                ->where('teachers.department_id', $departmentId);
        }
        if ($semester && $semester !== 'all') {
            $trendsQuery->where('evaluations.semester', $semester);
        }
        if ($year && $year !== 'all') {
            $trendsQuery->where('evaluations.academic_year', 'like', $year . '%');
        }

        $evaluationTrends = $trendsQuery->get()->map(function ($item) {
            return [
                'name' => $item->name,
                'evaluations' => $item->evaluations,
                'rating' => round($item->rating, 1)
            ];
        });

        // Department Participation Chart (Total evaluations per department)
        // This is for the Pie Chart: name, value
        $deptParticipationQuery = DB::table('evaluations')
            ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
            ->join('departments', 'teachers.department_id', '=', 'departments.id')
            ->select('departments.name as name', DB::raw('COUNT(*) as value'))
            ->groupBy('departments.name');

        if ($departmentId) {
            $deptParticipationQuery->where('departments.id', $departmentId);
        }
        if ($semester && $semester !== 'all') {
            $deptParticipationQuery->where('evaluations.semester', $semester);
        }
        if ($year && $year !== 'all') {
            $deptParticipationQuery->where('evaluations.academic_year', 'like', $year . '%');
        }

        $departmentParticipation = $deptParticipationQuery->get();

        return response()->json([
            'evaluationTrends' => $evaluationTrends,
            'departmentParticipation' => $departmentParticipation
        ]);
    }

    public function teacherPerformance(Request $request)
    {
        $departmentId = $request->query('department_id');
        $semester = $request->query('semester');
        $year = $request->query('year');

        // Base query for evaluations
        $query = EvaluationAnalytics::query()
            ->join('evaluations', 'evaluation_analytics.evaluation_id', '=', 'evaluations.id')
            ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
            ->select(
                'teachers.id',
                'teachers.name',
                DB::raw('AVG(evaluation_analytics.average_rating) as average_rating'),
                DB::raw('COUNT(evaluations.id) as total_evaluations')
            )
            ->groupBy('teachers.id', 'teachers.name');

        if ($departmentId) {
            $query->where('teachers.department_id', $departmentId);
        }
        if ($semester && $semester !== 'all') {
            $query->where('evaluations.semester', $semester);
        }
        if ($year && $year !== 'all') {
            $query->where('evaluations.academic_year', 'like', $year . '%');
        }

        $results = $query->orderByDesc('average_rating')->get();

        $topTeachers = $results->take(5)->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'average_rating' => round($item->average_rating, 2),
                'total_evaluations' => $item->total_evaluations
            ];
        })->values();

        $bottomTeachers = $results->reverse()->take(5)->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'average_rating' => round($item->average_rating, 2),
                'total_evaluations' => $item->total_evaluations
            ];
        })->values();

        return response()->json([
            'top' => $topTeachers,
            'bottom' => $bottomTeachers
        ]);
    }

    public function questionAnalysis(Request $request)
    {
        $departmentId = $request->query('department_id');
        $semester = $request->query('semester');
        $year = $request->query('year');

        $query = DB::table('responses')
            ->join('questions', 'responses.question_id', '=', 'questions.id')
            ->join('feedbacks', 'responses.feedback_id', '=', 'feedbacks.id')
            ->join('evaluations', 'feedbacks.evaluation_id', '=', 'evaluations.id')
            ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
            ->where('questions.type', 'rating')
            ->select(
                'questions.text',
                DB::raw('AVG(responses.rating) as average_rating')
            )
            ->groupBy('questions.id', 'questions.text');

        if ($departmentId) {
            $query->where('teachers.department_id', $departmentId);
        }
        if ($semester && $semester !== 'all') {
            $query->where('evaluations.semester', $semester);
        }
        if ($year && $year !== 'all') {
            $query->where('evaluations.academic_year', 'like', $year . '%');
        }

        $results = $query->orderBy('average_rating')->get()->map(function ($item) {
            return [
                'text' => $item->text,
                'average_rating' => round($item->average_rating, 2)
            ];
        });

        return response()->json($results);
    }

    public function export(Request $request)
    {
        $departmentId = $request->query('department_id');
        $semester = $request->query('semester');
        $year = $request->query('year');

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=report.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($departmentId, $semester, $year) {
            $file = fopen('php://output', 'w');
            
            // Summary Section
            fputcsv($file, ['Summary Statistics']);
            
            // Re-use logic from stats() but simplified for export
            $analyticsQuery = EvaluationAnalytics::query();
            $evaluationsQuery = Evaluation::query();
            
            if ($departmentId) {
                $analyticsQuery->whereHas('evaluation.teacher', function ($q) use ($departmentId) {
                    $q->where('department_id', $departmentId);
                });
                $evaluationsQuery->whereHas('teacher', function ($q) use ($departmentId) {
                    $q->where('department_id', $departmentId);
                });
            }

            if ($semester && $semester !== 'all') {
                $evaluationsQuery->where('semester', $semester);
                $analyticsQuery->whereHas('evaluation', function($q) use ($semester) {
                    $q->where('semester', $semester);
                });
            }

            if ($year && $year !== 'all') {
                $evaluationsQuery->where('academic_year', 'like', $year . '%');
                $analyticsQuery->whereHas('evaluation', function($q) use ($year) {
                    $q->where('academic_year', 'like', $year . '%');
                });
            }

            $totalEvaluations = $evaluationsQuery->count();
            $averageRating = $analyticsQuery->avg('average_rating') ?? 0;
            $participationRate = $analyticsQuery->avg('participation_rate') ?? 0;
            
            fputcsv($file, ['Total Evaluations', $totalEvaluations]);
            fputcsv($file, ['Average Rating', round($averageRating, 1)]);
            fputcsv($file, ['Participation Rate', round($participationRate, 1) . '%']);
            fputcsv($file, []); // Empty line

            // Evaluation Trends Section
            fputcsv($file, ['Evaluation Trends']);
            fputcsv($file, ['Period', 'Evaluations', 'Average Rating']);

            $trendsQuery = DB::table('evaluation_analytics')
                ->join('evaluations', 'evaluation_analytics.evaluation_id', '=', 'evaluations.id')
                ->select(
                    DB::raw("DATE_FORMAT(evaluation_analytics.calculated_at, '%Y-%m') as name"), 
                    DB::raw('COUNT(*) as evaluations'),
                    DB::raw('AVG(evaluation_analytics.average_rating) as rating')
                )
                ->groupBy('name')
                ->orderBy('name');

            if ($departmentId) {
                $trendsQuery->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                    ->where('teachers.department_id', $departmentId);
            }
            if ($semester && $semester !== 'all') {
                $trendsQuery->where('evaluations.semester', $semester);
            }
            if ($year && $year !== 'all') {
                $trendsQuery->where('evaluations.academic_year', 'like', $year . '%');
            }

            foreach ($trendsQuery->get() as $row) {
                fputcsv($file, [$row->name, $row->evaluations, round($row->rating, 1)]);
            }
            fputcsv($file, []); // Empty line

            // Department Participation Section
            fputcsv($file, ['Department Participation']);
            fputcsv($file, ['Department', 'Evaluations']);

            $deptParticipationQuery = DB::table('evaluations')
                ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                ->join('departments', 'teachers.department_id', '=', 'departments.id')
                ->select('departments.name as name', DB::raw('COUNT(*) as value'))
                ->groupBy('departments.name');

            if ($departmentId) {
                $deptParticipationQuery->where('departments.id', $departmentId);
            }
            if ($semester && $semester !== 'all') {
                $deptParticipationQuery->where('evaluations.semester', $semester);
            }
            if ($year && $year !== 'all') {
                $deptParticipationQuery->where('evaluations.academic_year', 'like', $year . '%');
            }

            foreach ($deptParticipationQuery->get() as $row) {
                fputcsv($file, [$row->name, $row->value]);
            }

            fputcsv($file, []); // Empty line

            // Teacher Performance Section
            fputcsv($file, ['Teacher Performance']);
            fputcsv($file, ['Teacher Name', 'Evaluations', 'Average Rating']);

            $teacherQuery = EvaluationAnalytics::query()
                ->join('evaluations', 'evaluation_analytics.evaluation_id', '=', 'evaluations.id')
                ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                ->select(
                    'teachers.name',
                    DB::raw('AVG(evaluation_analytics.average_rating) as average_rating'),
                    DB::raw('COUNT(evaluations.id) as total_evaluations')
                )
                ->groupBy('teachers.id', 'teachers.name');

            if ($departmentId) {
                $teacherQuery->where('teachers.department_id', $departmentId);
            }
            if ($semester && $semester !== 'all') {
                $teacherQuery->where('evaluations.semester', $semester);
            }
            if ($year && $year !== 'all') {
                $teacherQuery->where('evaluations.academic_year', 'like', $year . '%');
            }

            foreach ($teacherQuery->orderByDesc('average_rating')->get() as $row) {
                fputcsv($file, [$row->name, $row->total_evaluations, round($row->average_rating, 2)]);
            }

            fputcsv($file, []); // Empty line

            // Question Analysis Section
            fputcsv($file, ['Question Analysis']);
            fputcsv($file, ['Question', 'Average Rating']);

            $questionQuery = DB::table('responses')
                ->join('questions', 'responses.question_id', '=', 'questions.id')
                ->join('feedbacks', 'responses.feedback_id', '=', 'feedbacks.id')
                ->join('evaluations', 'feedbacks.evaluation_id', '=', 'evaluations.id')
                ->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                ->where('questions.type', 'rating')
                ->select(
                    'questions.text',
                    DB::raw('AVG(responses.rating) as average_rating')
                )
                ->groupBy('questions.id', 'questions.text');

            if ($departmentId) {
                $questionQuery->where('teachers.department_id', $departmentId);
            }
            if ($semester && $semester !== 'all') {
                $questionQuery->where('evaluations.semester', $semester);
            }
            if ($year && $year !== 'all') {
                $questionQuery->where('evaluations.academic_year', 'like', $year . '%');
            }

            foreach ($questionQuery->orderBy('average_rating')->get() as $row) {
                fputcsv($file, [$row->text, round($row->average_rating, 2)]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
