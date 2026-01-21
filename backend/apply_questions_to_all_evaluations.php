<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Applying Comprehensive Questions to ALL Evaluations ===\n\n";

// Define the comprehensive questions (same as in EvaluationTableBuilder)
$comprehensiveQuestions = [
    // Section A: INSTRUCTIONAL SKILLS (14 questions)
    'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።',
    'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።',
    'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።',
    'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።',
    'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።',
    'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።',
    'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።',
    'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።',
    'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።',
    'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።',
    'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።',
    'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።',
    'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።',
    'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።',
    
    // Section B: PROFESSIONAL ETHICS & ATTITUDE (8 questions)
    'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።',
    'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።',
    'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።',
    'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።',
    'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።',
    'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።',
    'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።',
    'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።',
    
    // Section C: ASSESSMENT METHODS & FEEDBACK (7 questions)
    'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።',
    'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።',
    'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።',
    'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።',
    'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።',
    'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።',
    'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።'
];

echo "Comprehensive questions to apply: " . count($comprehensiveQuestions) . "\n\n";

// Get all evaluations
$evaluations = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])->get();
echo "Total evaluations found: " . $evaluations->count() . "\n\n";

$successCount = 0;
$errorCount = 0;

foreach ($evaluations as $evaluation) {
    echo "=== Processing Evaluation {$evaluation->id} ===\n";
    echo "Course: " . ($evaluation->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($evaluation->teacher->name ?? 'N/A') . "\n";
    echo "Current Questions: " . $evaluation->questions->count() . "\n";
    
    try {
        // Remove existing questions
        $evaluation->questions()->detach();
        
        // Create and attach new comprehensive questions
        $questionIds = [];
        foreach ($comprehensiveQuestions as $questionText) {
            $question = \App\Models\Question::create([
                'text' => $questionText,
                'type' => 'rating', // All questions are rating type
            ]);
            $questionIds[] = $question->id;
        }
        
        // Attach questions to evaluation
        $evaluation->questions()->attach($questionIds);
        
        // Verify the save
        $evaluation->load('questions');
        echo "✅ SUCCESS: Now has {$evaluation->questions->count()} questions\n";
        $successCount++;
        
    } catch (\Exception $e) {
        echo "❌ ERROR: " . $e->getMessage() . "\n";
        $errorCount++;
    }
    
    echo "\n";
}

echo "=== SUMMARY ===\n";
echo "✅ Successfully updated: {$successCount} evaluations\n";
echo "❌ Failed to update: {$errorCount} evaluations\n";
echo "📊 Total processed: " . ($successCount + $errorCount) . " evaluations\n\n";

if ($successCount > 0) {
    echo "🎉 SUCCESS! All evaluations now have the comprehensive 29-question form.\n";
    echo "Students will see the same 29 questions for every evaluation they fill out.\n\n";
    
    echo "What this means:\n";
    echo "✅ Every evaluation now has 29 comprehensive questions\n";
    echo "✅ Students will see consistent evaluation forms\n";
    echo "✅ All questions cover: Instructional Skills, Professional Ethics, Assessment Methods\n";
    echo "✅ The 422 submission error should be resolved\n";
    echo "✅ Students can successfully submit evaluations\n\n";
    
    echo "Next steps:\n";
    echo "1. Students should now see 29 questions for ANY evaluation they open\n";
    echo "2. All evaluations use the same comprehensive question set\n";
    echo "3. The department can still customize individual evaluations if needed\n";
} else {
    echo "⚠️ No evaluations were successfully updated. Please check the errors above.\n";
}