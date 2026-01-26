<?php

namespace App\Http\Controllers;

use App\Models\DepartmentHodEvaluationTemplate;
use App\Models\HodTemplateQuestion;
use Illuminate\Http\Request;

class HodTemplateController extends Controller
{
    public function getTemplate($departmentId)
    {
        $template = DepartmentHodEvaluationTemplate::getActiveTemplate($departmentId);
        if (!$template) {
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

        // Replace questions
        HodTemplateQuestion::where('template_id', $template->id)->delete();
        foreach ($data['questions'] as $index => $q) {
            HodTemplateQuestion::create([
                'template_id' => $template->id,
                'text' => $q['text'],
                'type' => $q['type'],
                'section' => $q['section'] ?? null,
                'order' => $q['order'] ?? ($index + 1),
            ]);
        }

        return response()->json([
            'message' => 'HOD template updated successfully',
            'template' => $template->fresh('questions'),
        ]);
    }
}