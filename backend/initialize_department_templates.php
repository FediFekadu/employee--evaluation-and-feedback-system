<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Initializing Department Evaluation Templates ===\n\n";

// Get all departments
$departments = \App\Models\Department::all();
echo "Found " . $departments->count() . " departments\n\n";

// Define the comprehensive questions
$comprehensiveQuestions = [
    // Section A: INSTRUCTIONAL SKILLS (14 questions)
    ['text' => 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'section' => 'A'],
    ['text' => 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'section' => 'A'],
    ['text' => 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'section' => 'A'],
    ['text' => 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'section' => 'A'],
    ['text' => 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'section' => 'A'],
    ['text' => 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'section' => 'A'],
    ['text' => 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'section' => 'A'],
    ['text' => 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'section' => 'A'],
    ['text' => 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'section' => 'A'],
    ['text' => 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'section' => 'A'],
    ['text' => 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'section' => 'A'],
    ['text' => 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'section' => 'A'],
    ['text' => 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'section' => 'A'],
    ['text' => 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'section' => 'A'],
    
    // Section B: PROFESSIONAL ETHICS & ATTITUDE (8 questions)
    ['text' => 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'section' => 'B'],
    ['text' => 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'section' => 'B'],
    ['text' => 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'section' => 'B'],
    ['text' => 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'section' => 'B'],
    ['text' => 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'section' => 'B'],
    ['text' => 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'section' => 'B'],
    ['text' => 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'section' => 'B'],
    ['text' => 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'section' => 'B'],
    
    // Section C: ASSESSMENT METHODS & FEEDBACK (7 questions)
    ['text' => 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'section' => 'C'],
    ['text' => 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'section' => 'C'],
    ['text' => 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'section' => 'C'],
    ['text' => 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'section' => 'C'],
    ['text' => 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'section' => 'C'],
    ['text' => 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'section' => 'C'],
    ['text' => 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'section' => 'C']
];

$formInfo = [
    'university' => 'BULE-HORA UNIVERSITY',
    'formTitle' => "Teachers' Performance Evaluation Criteria To be filled by student",
    'year' => date('Y'),
    'semester' => 'First'
];

$successCount = 0;
$errorCount = 0;

foreach ($departments as $department) {
    echo "=== Processing Department: {$department->name} (ID: {$department->id}) ===\n";
    
    try {
        // Check if template already exists
        $existingTemplate = \App\Models\DepartmentEvaluationTemplate::where('department_id', $department->id)
            ->where('is_active', true)
            ->first();
        
        if ($existingTemplate) {
            echo "⚠️ Template already exists, updating...\n";
            $template = $existingTemplate;
            $template->update([
                'form_info' => $formInfo,
                'description' => 'Comprehensive teacher evaluation template with 29 questions covering instructional skills, professional ethics, and assessment methods.'
            ]);
        } else {
            // Create new template
            $template = \App\Models\DepartmentEvaluationTemplate::create([
                'department_id' => $department->id,
                'name' => 'Comprehensive Teacher Evaluation Template',
                'description' => 'Comprehensive teacher evaluation template with 29 questions covering instructional skills, professional ethics, and assessment methods.',
                'form_info' => $formInfo,
                'is_active' => true,
            ]);
            echo "✅ Created new template\n";
        }
        
        // Remove existing questions
        $template->questions()->delete();
        
        // Add comprehensive questions
        foreach ($comprehensiveQuestions as $index => $questionData) {
            \App\Models\TemplateQuestion::create([
                'template_id' => $template->id,
                'text' => $questionData['text'],
                'type' => 'rating',
                'section' => $questionData['section'],
                'order' => $index + 1,
            ]);
        }
        
        echo "✅ Added " . count($comprehensiveQuestions) . " questions\n";
        $successCount++;
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        $errorCount++;
    }
    
    echo "\n";
}

echo "=== SUMMARY ===\n";
echo "✅ Successfully processed: {$successCount} departments\n";
echo "❌ Failed to process: {$errorCount} departments\n\n";

if ($successCount > 0) {
    echo "🎉 SUCCESS! Department evaluation templates have been initialized.\n\n";
    echo "What this means:\n";
    echo "✅ Each department now has a comprehensive 29-question evaluation template\n";
    echo "✅ Future evaluations will automatically use these questions\n";
    echo "✅ Departments can manage their own evaluation forms\n";
    echo "✅ Students will see consistent evaluation forms\n";
    echo "✅ No more manual question assignment needed\n\n";
    
    echo "Next steps:\n";
    echo "1. Update the frontend to use the new template system\n";
    echo "2. Students will load questions from department templates\n";
    echo "3. Departments can customize their evaluation forms as needed\n";
}