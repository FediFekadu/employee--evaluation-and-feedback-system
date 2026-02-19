<?php

namespace App\Http\Controllers;

use App\Models\DepartmentHodEvaluationTemplate;
use App\Models\HodTemplateQuestion;
use Illuminate\Http\Request;

class HodTemplateController extends Controller
{
    public function getTemplate($departmentId)
    {
        // Try to get specific template for this department
        $template = DepartmentHodEvaluationTemplate::getActiveTemplate($departmentId);
        
        // Fallback: If no specific template found, try to find ANY active template (useful for demo/dev)
        if (!$template) {
            $template = DepartmentHodEvaluationTemplate::where('is_active', true)
                ->with('questions')
                ->first();
        }

        if (!$template) {
            // Last resort: If no template found, fetch questions directly from hod_template_questions
            // This ensures we always return something if the table has data, as requested
            $questions = HodTemplateQuestion::orderBy('order')->take(20)->get();
            
            if ($questions->isNotEmpty()) {
                return response()->json([
                    'template' => [
                        'id' => null,
                        'name' => 'Default Template (Fallback)',
                        'description' => 'Generated from available questions'
                    ],
                    'questions' => $questions,
                ]);
            }

            return response()->json([
                'template' => null,
                'questions' => [],
            ]);
        }
        
        return response()->json([
            'template' => $template,
            'questions' => $template->questions()->orderBy('order')->get(),
        ]);
    }

    public function updateTemplate(Request $request, $departmentId)
    {
        $data = $request->validate([
            'template' => 'required|array',
            'template.name' => 'required|string',
            'template.description' => 'nullable|string',
            'template.form_info' => 'nullable|array',
            'questions' => 'required|array',
            'questions.*.id' => 'nullable|integer',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:rating,text',
            'questions.*.section' => 'nullable|string',
            'questions.*.order' => 'nullable|integer',
        ]);

        $template = DepartmentHodEvaluationTemplate::firstOrCreate(
            ['department_id' => $departmentId, 'is_active' => true],
            [
                'name' => $data['template']['name'],
                'description' => $data['template']['description'] ?? null,
                'form_info' => $data['template']['form_info'] ?? null,
            ]
        );

        // Update template meta
        $template->name = $data['template']['name'];
        $template->description = $data['template']['description'] ?? null;
        $template->form_info = $data['template']['form_info'] ?? null;
        $template->save();

        // Smart sync questions to preserve IDs where possible
        $existingQuestions = $template->questions;
        $keptIds = [];

        foreach ($data['questions'] as $index => $q) {
            $match = null;
            
            // Try to find by ID if provided
            if (isset($q['id'])) {
                $match = $existingQuestions->firstWhere('id', $q['id']);
            }
            
            // If no ID or not found, try to find by text and type (heuristic to preserve IDs)
            if (!$match) {
                $match = $existingQuestions->first(function ($item) use ($q) {
                    return $item->text === $q['text'] && $item->type === $q['type'];
                });
            }

            if ($match) {
                $match->update([
                    'text' => $q['text'],
                    'type' => $q['type'],
                    'section' => null, // Sections removed as requested
                    'order' => $q['order'] ?? ($index + 1),
                ]);
                $keptIds[] = $match->id;
            } else {
                $newQ = HodTemplateQuestion::create([
                    'template_id' => $template->id,
                    'text' => $q['text'],
                    'type' => $q['type'],
                    'section' => null, // Sections removed as requested
                    'order' => $q['order'] ?? ($index + 1),
                ]);
                $keptIds[] = $newQ->id;
            }
        }

        // Delete questions that were removed from the template
        // Note: This will still break old evaluations if questions are genuinely removed.
        // But it prevents breakage when just saving/reordering without changes.
        $template->questions()->whereNotIn('id', $keptIds)->delete();

        return response()->json([
            'message' => 'HOD template updated successfully',
            'template' => $template->fresh('questions'),
        ]);
    }
}