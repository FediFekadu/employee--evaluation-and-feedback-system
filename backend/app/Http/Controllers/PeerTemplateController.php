<?php

namespace App\Http\Controllers;

use App\Models\DepartmentPeerEvaluationTemplate;
use App\Models\PeerTemplateQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeerTemplateController extends Controller
{
    /**
     * Get the active peer template for a department
     */
    public function getTemplate($departmentId)
    {
        $template = DepartmentPeerEvaluationTemplate::getActiveTemplate($departmentId);

        if (!$template) {
            return response()->json([
                'message' => 'No active peer template found for this department',
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
     * Update or create the department peer template
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
            'questions.*.section' => 'nullable|string|max:10',
        ]);

        return DB::transaction(function () use ($data, $departmentId) {
            // Get or create the active peer template
            $template = DepartmentPeerEvaluationTemplate::where('department_id', $departmentId)
                ->where('is_active', true)
                ->first();

            if (!$template) {
                $template = DepartmentPeerEvaluationTemplate::create([
                    'department_id' => $departmentId,
                    'name' => $data['name'] ?? 'Default Peer Evaluation Template',
                    'description' => $data['description'] ?? null,
                    'form_info' => $data['form_info'] ?? null,
                    'is_active' => true,
                ]);
            } else {
                $template->update([
                    'name' => $data['name'] ?? $template->name,
                    'description' => $data['description'] ?? $template->description,
                    'form_info' => $data['form_info'] ?? $template->form_info,
                ]);
            }

            // Remove existing questions
            $template->questions()->delete();

            // Add new questions
            foreach ($data['questions'] as $index => $questionData) {
                PeerTemplateQuestion::create([
                    'template_id' => $template->id,
                    'text' => $questionData['text'],
                    'type' => $questionData['type'],
                    'section' => $questionData['section'] ?? null,
                    'order' => $index + 1,
                ]);
            }

            return response()->json([
                'message' => 'Peer template updated successfully',
                'template' => $template->load('questions')
            ]);
        });
    }

    /**
     * Get peer questions for an evaluation (from peer template)
     */
    public function getQuestionsForEvaluation($evaluationId)
    {
        $evaluation = \App\Models\Evaluation::with('course.department')->find($evaluationId);

        if (!$evaluation) {
            return response()->json(['error' => 'Evaluation not found'], 404);
        }

        $departmentId = $evaluation->course->department_id;
        $template = DepartmentPeerEvaluationTemplate::getActiveTemplate($departmentId);

        if (!$template) {
            return response()->json([
                'questions' => [],
                'form_info' => null,
                'message' => 'No peer template configured for this department'
            ]);
        }

        // For peer questions, we return template questions directly
        $questions = $template->questions()->get();

        return response()->json([
            'questions' => $questions,
            'form_info' => $template->form_info,
            'template_name' => $template->name
        ]);
    }
}