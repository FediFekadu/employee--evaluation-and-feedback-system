<?php

namespace App\Http\Controllers;

use App\Models\DepartmentEvaluationTemplate;
use App\Models\TemplateQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentTemplateController extends Controller
{
    /**
     * Get the active template for a department
     */
    public function getTemplate(Request $request, $departmentId)
    {
        $audience = strtolower($request->query('audience', 'student'));
        if (!in_array($audience, ['student', 'peer', 'admin'])) {
            $audience = 'student';
        }
        $template = DepartmentEvaluationTemplate::getActiveTemplate($departmentId, $audience);
        
        if (!$template) {
            return response()->json([
                'message' => 'No active template found for this department',
                'template' => null,
                'questions' => []
            ]);
        }

        return response()->json([
            'template' => $template,
            'questions' => $template->questions
        ]);
    }

    /**
     * Update or create the department template
     */
    public function updateTemplate(Request $request, $departmentId)
    {
        $data = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'form_info' => 'nullable|array',
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:rating,text',
            'questions.*.section' => 'nullable|string',
        ]);

        $audience = strtolower($request->query('audience', 'student'));
        if (!in_array($audience, ['student', 'peer', 'admin'])) {
            $audience = 'student';
        }

        return DB::transaction(function () use ($data, $departmentId, $audience) {
            // Get or create the active template
            $template = DepartmentEvaluationTemplate::where('department_id', $departmentId)
                ->where('is_active', true)
                ->where('audience', $audience)
                ->first();

            if (!$template) {
                $template = DepartmentEvaluationTemplate::create([
                    'department_id' => $departmentId,
                    'name' => $data['name'] ?? 'Default Evaluation Template',
                    'description' => $data['description'] ?? null,
                    'audience' => $audience,
                    'form_info' => $data['form_info'] ?? null,
                    'is_active' => true,
                ]);
            } else {
                $template->update([
                    'name' => $data['name'] ?? $template->name,
                    'description' => $data['description'] ?? $template->description,
                    'audience' => $audience,
                    'form_info' => $data['form_info'] ?? $template->form_info,
                ]);
            }

            // Remove existing questions
            $template->questions()->delete();

            // Add new questions
            foreach ($data['questions'] as $index => $questionData) {
                TemplateQuestion::create([
                    'template_id' => $template->id,
                    'text' => $questionData['text'],
                    'type' => $questionData['type'],
                    'section' => null, // Sections removed as requested
                    'order' => $index + 1,
                ]);
            }

            return response()->json([
                'message' => 'Template updated successfully',
                'template' => $template->load('questions')
            ]);
        });
    }

    /**
     * Get questions for student evaluations (from template)
     */
    public function getQuestionsForEvaluation(Request $request, $evaluationId)
    {
        // Get the evaluation and its department
        $evaluation = \App\Models\Evaluation::with('course.department')->find($evaluationId);
        
        if (!$evaluation) {
            return response()->json(['error' => 'Evaluation not found'], 404);
        }

        $departmentId = $evaluation->course->department_id;
        $audience = strtolower($request->query('audience', 'student'));
        if (!in_array($audience, ['student', 'peer', 'admin'])) {
            $audience = 'student';
        }
        $template = DepartmentEvaluationTemplate::getActiveTemplate($departmentId, $audience);

        if (!$template) {
            return response()->json([
                'questions' => [],
                'form_info' => null,
                'message' => 'No template configured for this department'
            ]);
        }

        // Ensure evaluation has individual questions created from template
        $this->ensureEvaluationHasQuestions($evaluation, $template);

        // Get the individual questions for this evaluation
        $questions = $evaluation->questions()->orderBy('evaluation_questions.order')->get();

        return response()->json([
            'questions' => $questions,
            'form_info' => $template->form_info,
            'template_name' => $template->name,
            'audience' => $audience
        ]);
    }

    /**
     * Ensure evaluation has individual questions created from template
     */
    private function ensureEvaluationHasQuestions($evaluation, $template)
    {
        // Check if evaluation already has questions
        if ($evaluation->questions()->count() > 0) {
            return;
        }

        // Create individual questions from template
        foreach ($template->questions as $templateQuestion) {
            $question = \App\Models\Question::create([
                'text' => $templateQuestion->text,
                'type' => $templateQuestion->type,
                'section' => $templateQuestion->section,
            ]);

            // Attach question to evaluation
            $evaluation->questions()->attach($question->id, [
                'order' => $templateQuestion->order
            ]);
        }
    }
}