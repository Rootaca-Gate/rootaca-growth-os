import {
  catalogLabel,
  localizeAssessmentSummary,
  localizeList,
  localizeText,
} from './report-catalog-i18n';

describe('report catalog i18n', () => {
  it('keeps English catalog names unchanged', () => {
    expect(catalogLabel('en', 'skill', 'DEBUGGING', 'Debugging')).toBe('Debugging');
    expect(localizeText('en', 'Grade 8')).toBe('Grade 8');
  });

  it('translates levels, KPIs, projects, and student phrases to Arabic', () => {
    expect(catalogLabel('ar', 'level', 'JUNIOR', 'Junior')).toBe('ناشئ');
    expect(catalogLabel('ar', 'kpi', 'CODING_PROBLEMS', 'Coding Problems')).toBe('مسائل برمجية');
    expect(catalogLabel('ar', 'kpiUnit', 'hours', 'hours')).toBe('ساعات');
    expect(catalogLabel('ar', 'project', 'FIRST_WEB_PAGE', 'First Web Page Studio')).toBe(
      'استوديو أول صفحة ويب',
    );
    expect(localizeText('ar', 'Grade 8')).toBe('الصف 8');
    expect(localizeText('ar', 'Web')).toBe('الويب');
    expect(localizeText('ar', 'Foundations')).toBe('الأساسيات');
    expect(localizeText('ar', 'Set up the web workspace')).toBe('إعداد بيئة الويب');
    expect(localizeText('ar', 'Ship a small website')).toBe('تسليم موقع صغير');
    expect(localizeList('ar', ['Web', 'Games'], '—')).toBe('الويب، الألعاب');
  });

  it('rebuilds an Arabic assessment summary from live scores', () => {
    expect(
      localizeAssessmentSummary(
        'ar',
        64,
        [
          { name: 'حل المشكلات', score: 70 },
          { name: 'المعرفة التقنية', score: 40 },
        ],
        'Overall score 64/100',
      ),
    ).toContain('الدرجة الكلية 64/100');
  });
});
