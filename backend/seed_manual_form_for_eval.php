<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// Usage: php seed_manual_form_for_eval.php <evaluation_id>
$evaluationId = isset($argv[1]) ? (int)$argv[1] : null;
if (!$evaluationId) {
    echo "Usage: php seed_manual_form_for_eval.php <evaluation_id>\n";
    exit(1);
}

/** @var \App\Models\Evaluation|null $evaluation */
$evaluation = \App\Models\Evaluation::with('questions')->find($evaluationId);
if (!$evaluation) {
    echo "Evaluation not found: {$evaluationId}\n";
    exit(1);
}

// Manual criteria items (A/B/C) as rating questions
$sections = [
    'A' => [
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
    ],
    'B' => [
        'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።',
        'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።',
        'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።',
        'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።',
        'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።',
        'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።',
        'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።',
        'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።',
    ],
    'C' => [
        'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።',
        'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።',
        'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።',
        'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።',
        'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።',
        'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።',
        'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።',
    ],
];

echo "Seeding manual form for evaluation {$evaluationId}...\n";

// Detach existing questions
$evaluation->questions()->detach();

// Create and attach new rating questions
$questionIds = [];
$count = 0;
foreach ($sections as $key => $items) {
    foreach ($items as $text) {
        $q = \App\Models\Question::create(['text' => $text, 'type' => 'rating']);
        $questionIds[] = $q->id;
        $count++;
    }
}
$evaluation->questions()->attach($questionIds);

echo "Attached {$count} questions.\n";
echo "Done.\n";