import React, { useState, useMemo } from 'react';
import api from '../services/api';

function DepartmentTemplateManager({ departmentId, template, questions, onTemplateSaved, audience = 'student' }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Form header information
  const [formInfo, setFormInfo] = useState({
    university: template?.form_info?.university || 'BULE-HORA UNIVERSITY',
    formTitle: template?.form_info?.formTitle || (
      audience === 'peer'
        ? "Peer-to-Peer Teacher Evaluation Criteria"
        : audience === 'hod'
          ? "Head of Department Teacher Evaluation Criteria"
          : "Teachers' Performance Evaluation Criteria To be filled by student"
    ),
    year: template?.form_info?.year || new Date().getFullYear(),
    semester: template?.form_info?.semester || 'First'
  });

  // Default comprehensive sections
  const defaultSections = useMemo(() => ([
    {
      key: 'A',
      title: 'A. INSTRUCTIONAL SKILLS: የማስተማር/የአስተማሪ ችሎታዎች',
      items: [
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
        'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።'
      ],
    },
    {
      key: 'B',
      title: 'B. PROFESSIONAL ETHICS & ATTITUDE TOWARDS THE STUDENTS: የሙያዊ ስነ-ምግባር እና ከተማሪዎች ጋር ያለው አመለካከት',
      items: [
        'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።',
        'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።',
        'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።',
        'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።',
        'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።',
        'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።',
        'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።',
        'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።'
      ],
    },
    {
      key: 'C',
      title: 'C. ASSESSMENT METHODS & FEEDBACK: የግምገማ ዘዴዎች እና ግብረመልስ',
      items: [
        'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።',
        'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።',
        'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።',
        'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።',
        'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።',
        'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።',
        'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።'
      ],
    },
  ]), []);

  // Initialize sections from existing questions or use defaults
  const [sections, setSections] = useState(() => {
    if (questions && questions.length > 0) {
      // Group existing questions by section
      const grouped = questions.reduce((acc, q) => {
        const section = q.section || 'A';
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(q.text);
        return acc;
      }, {});

      return defaultSections.map(section => ({
        ...section,
        items: grouped[section.key] || section.items
      }));
    }
    return defaultSections;
  });

  const saveTemplate = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Flatten all questions from sections
      const allQuestions = sections.flatMap((section, sectionIndex) => 
        section.items.map((text, itemIndex) => ({
          text: text.trim(),
          type: 'rating',
          section: section.key
        }))
      ).filter(q => q.text.length > 0);

      if (allQuestions.length === 0) {
        setMessage('❌ Please add at least one question');
        return;
      }

      const endpoint = audience === 'peer'
        ? `/departments/${departmentId}/peer-template`
        : audience === 'hod'
          ? `/departments/${departmentId}/hod-template`
          : `/departments/${departmentId}/template`;

      const common = {
        name: 'Comprehensive Teacher Evaluation Template',
        description: 'Department evaluation template with comprehensive questions covering instructional skills, professional ethics, and assessment methods.',
        form_info: formInfo,
      };

      const payload = audience === 'hod'
        ? { template: common, questions: allQuestions }
        : { ...common, questions: allQuestions };

      await api.put(endpoint, payload);

      setMessage(`✅ Template saved successfully! ${allQuestions.length} questions configured.`);
      onTemplateSaved?.();
      
    } catch (error) {
      console.error('Failed to save template:', error);
      setMessage('❌ Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (sectionIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { ...section, items: [...section.items, ''] }
        : section
    ));
  };

  const removeItem = (sectionIndex, itemIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { ...section, items: section.items.filter((_, j) => j !== itemIndex) }
        : section
    ));
  };

  const updateItem = (sectionIndex, itemIndex, text) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { ...section, items: section.items.map((item, j) => j === itemIndex ? text : item) }
        : section
    ));
  };

  const totalQuestions = sections.reduce((sum, section) => sum + section.items.filter(item => item.trim()).length, 0);

  return (
    <div className="template-manager">
      {/* Header */}
      <div className="template-header">
        <div className="template-info">
          <h2>{audience === 'peer' ? 'Peer Evaluation Template' : audience === 'hod' ? 'HOD Evaluation Template' : 'Student Evaluation Template'}</h2>
          <p>Configure the evaluation questions that will be used for all {audience === 'peer' ? 'peer evaluations' : audience === 'hod' ? 'HOD evaluations' : 'student evaluations'} in this department.</p>
          <div className="template-stats">
            <span className="stat">📝 {totalQuestions} Questions</span>
            <span className="stat">📊 {sections.length} Sections</span>
            <span className="stat">🎯 {audience === 'peer' ? 'Peer Evaluations' : audience === 'hod' ? 'HOD Evaluations' : 'Student Evaluations'}</span>
          </div>
        </div>
        
        <div className="template-actions">
          <button 
            className={`dept-btn ${previewMode ? 'dept-btn-ghost' : 'dept-btn-primary'}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '📝 Edit Mode' : '👁️ Preview Mode'}
          </button>
          <button 
            className="dept-btn dept-btn-primary" 
            onClick={saveTemplate} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`template-message ${message.includes('Failed') || message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Form Info */}
      <div className="form-info-section">
        <h3>Form Information</h3>
        <div className="form-info-grid">
          <div className="form-field">
            <label>University Name:</label>
            <input 
              className="dept-input" 
              value={formInfo.university}
              onChange={(e) => setFormInfo(prev => ({...prev, university: e.target.value}))}
              readOnly={previewMode}
            />
          </div>
          <div className="form-field">
            <label>Form Title:</label>
            <input 
              className="dept-input" 
              value={formInfo.formTitle}
              onChange={(e) => setFormInfo(prev => ({...prev, formTitle: e.target.value}))}
              readOnly={previewMode}
            />
          </div>
          <div className="form-field">
            <label>Academic Year:</label>
            <input 
              className="dept-input" 
              type="number"
              value={formInfo.year}
              onChange={(e) => setFormInfo(prev => ({...prev, year: parseInt(e.target.value)}))}
              readOnly={previewMode}
            />
          </div>
          <div className="form-field">
            <label>Semester:</label>
            <select 
              className="dept-select" 
              value={formInfo.semester}
              onChange={(e) => setFormInfo(prev => ({...prev, semester: e.target.value}))}
              disabled={previewMode}
            >
              <option value="First">First</option>
              <option value="Second">Second</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="template-sections">
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="template-section">
            <div className="section-header">
              <h3>{section.title}</h3>
              {!previewMode && (
                <button 
                  className="dept-btn dept-btn-ghost"
                  onClick={() => addItem(sectionIndex)}
                >
                  Add Question
                </button>
              )}
            </div>
            
            <div className="section-questions">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="question-item">
                  <div className="question-number">{itemIndex + 1}</div>
                  <textarea
                    className="question-input"
                    value={item}
                    onChange={(e) => updateItem(sectionIndex, itemIndex, e.target.value)}
                    placeholder="Enter question text..."
                    rows="2"
                    readOnly={previewMode}
                  />
                  {!previewMode && (
                    <button 
                      className="remove-question"
                      onClick={() => removeItem(sectionIndex, itemIndex)}
                      title="Remove question"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="template-instructions">
        <h3>How This Works</h3>
        <ul>
          <li>✅ <strong>All {audience === 'peer' ? 'peer' : audience === 'hod' ? 'HOD' : 'student'} evaluations</strong> in this department will use these questions</li>
          <li>✅ <strong>{audience === 'peer' ? 'Peers will see' : audience === 'hod' ? 'HODs will see' : 'Students will see'}</strong> these questions when filling out any evaluation</li>
          <li>✅ <strong>Future evaluations</strong> will automatically use this template</li>
          <li>✅ <strong>Consistent experience</strong> across all teacher evaluations</li>
          <li>⚙️ <strong>Easy management</strong> - update once, applies everywhere</li>
        </ul>
      </div>
    </div>
  );
}

export default DepartmentTemplateManager;