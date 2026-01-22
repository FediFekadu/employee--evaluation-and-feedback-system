// Lightweight CSV generator for Evaluation Results data
// Builds a minimal, consistent CSV using safe fields present in the results payload

function sanitize(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Wrap fields containing commas, quotes, or newlines in quotes
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function toRow(cells) {
  return cells.map(sanitize).join(',');
}

function buildHeader() {
  return [
    'Evaluation ID',
    'Course Code',
    'Course Title',
    'Instructor Name',
    'Total Responses',
    'Final Score',
    'Performance Level',
    'Opened At',
    'Closed At'
  ];
}

function extractBasics(results) {
  const course = results?.course_information || results?.courseInfo || {};
  const instructor = results?.instructor_information || results?.instructorInfo || {};
  const quickStats = results?.quick_stats || results?.quickStats || {};

  // final_score / performance_level may be at root or nested
  const finalScore = results?.final_score ?? results?.score_breakdown?.final_score ?? '';
  const performanceLevel = results?.performance_level ?? results?.score_breakdown?.performance_level ?? '';

  return {
    evaluationId: results?.evaluation_id ?? results?.id ?? '',
    courseCode: course?.code ?? course?.course_code ?? '',
    courseTitle: course?.title ?? course?.course_title ?? '',
    instructorName: instructor?.name ?? instructor?.full_name ?? '',
    totalResponses: quickStats?.total_responses ?? quickStats?.responses ?? '',
    finalScore,
    performanceLevel,
    openedAt: results?.opened_at ?? results?.dates?.opened_at ?? '',
    closedAt: results?.closed_at ?? results?.dates?.closed_at ?? ''
  };
}

function buildRatingDistributionRows(results) {
  const dist = results?.participation_analysis?.rating_distribution ||
               results?.response_statistics?.rating_distribution || {};
  const entries = Object.entries(dist);
  if (entries.length === 0) return [];

  // Header row for distribution
  const header = ['Rating', 'Count', 'Percent'];
  const rows = [toRow(header)];

  const mapped = entries
    .map(([rating, value]) => {
      const count = typeof value === 'object' && value !== null ? Number(value.count || 0) : Number(value || 0);
      const percent = typeof value === 'object' && value !== null ? Number(value.percentage || 0) : 0;
      return { rating: Number(rating), count, percent };
    })
    .sort((a, b) => a.rating - b.rating);

  const total = mapped.reduce((sum, r) => sum + (r.count || 0), 0);
  mapped.forEach(r => {
    const pct = r.percent || (total > 0 ? Math.round((r.count / total) * 100) : 0);
    rows.push(toRow([r.rating, r.count, `${pct}%`]));
  });

  return rows;
}

export function generateCsvFromEvaluationResults(results, opts = {}) {
  const basics = extractBasics(results);
  const header = buildHeader();
  const mainRow = toRow([
    basics.evaluationId,
    basics.courseCode,
    basics.courseTitle,
    basics.instructorName,
    basics.totalResponses,
    basics.finalScore,
    basics.performanceLevel,
    basics.openedAt,
    basics.closedAt
  ]);

  const lines = [toRow(header), mainRow, '', 'Rating Distribution', ...buildRatingDistributionRows(results)];
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });

  const filename = opts.preferredFilename || `evaluation_${basics.evaluationId || 'report'}_fallback.csv`;
  return { blob, filename };
}

export default {
  generateCsvFromEvaluationResults
};