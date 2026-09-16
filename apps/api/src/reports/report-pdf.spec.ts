import { renderStudentProgressPdf } from './report-pdf';
import { StudentProgressReportDto } from './dto/report-response.dto';

describe('renderStudentProgressPdf', () => {
  it('renders an English branded PDF', async () => {
    const buffer = await renderStudentProgressPdf(sampleReport('en'));
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it('renders an Arabic RTL PDF', async () => {
    const report = sampleReport('ar');
    report.title = 'تقرير تقدم الطالب';
    report.student.fullName = 'يارا حسن';
    report.student.fields[0] = { label: 'الاسم الكامل', value: 'يارا حسن' };
    report.achievements = ['إكمال مشروع الصفحة الشخصية'];
    const buffer = await renderStudentProgressPdf(report);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(2000);
    expect(buffer.includes(Buffer.from('NotoSansArabic'))).toBe(true);
  });
});

function sampleReport(locale: 'en' | 'ar'): StudentProgressReportDto {
  return {
    studentId: '11111111-1111-4111-8111-111111111111',
    locale,
    generatedAt: '2026-09-16T00:00:00.000Z',
    title: 'Student Progress Report',
    fileName: 'ROOTACA-Progress-Yara-Hassan-2026-09-16.pdf',
    student: {
      id: '11111111-1111-4111-8111-111111111111',
      fullName: 'Yara Hassan',
      fields: [
        { label: 'Full name', value: 'Yara Hassan' },
        { label: 'School grade', value: 'Grade 8' },
        { label: 'Learning goal', value: 'Build small websites with confidence.' },
      ],
    },
    currentLevel: {
      name: 'Beginner',
      code: 'BEGINNER',
      description: 'First independent pages and simple logic.',
    },
    assessment: {
      overallScore: 64,
      completedAt: '2026-09-01',
      summary: 'Ready for guided web projects.',
      categories: [{ name: 'Problem Solving', score: 70, detail: '30%' }],
    },
    skills: [{ name: 'Programming Fundamentals', score: 72 }],
    recommendedPath: {
      name: 'Web Development',
      code: 'WEB',
      description: 'HTML, CSS, and JavaScript',
      reasons: ['Interest in web'],
      alternativeName: 'General',
      alternativeReasons: [],
    },
    roadmap: {
      pathName: 'Web Development',
      levelName: 'Beginner',
      overallPercent: 40,
      completedCount: 2,
      itemCount: 6,
      inProgressCount: 1,
      blockedCount: 0,
      phases: [{ title: 'Foundations', percent: 40, completedCount: 2, itemCount: 6 }],
    },
    kpis: {
      overallPercent: 35,
      overallStatus: 'AT_RISK',
      overallStatusLabel: 'At risk',
      items: [
        {
          name: 'Coding Problems',
          actual: 3,
          target: 10,
          unit: 'problems',
          progressPercent: 30,
          status: 'BEHIND',
          statusLabel: 'Behind',
        },
      ],
    },
    projects: {
      overallPercent: 25,
      assignedCount: 1,
      completedCount: 0,
      items: [
        {
          name: 'Personal Portfolio Page',
          status: 'IN_PROGRESS',
          statusLabel: 'In progress',
          progressPercent: 25,
        },
      ],
    },
    achievements: ['Programming Fundamentals is a strength at 72/100.'],
    areasForImprovement: ['Coding Problems is behind target.'],
    nextGoals: ['Finish the first HTML page'],
  };
}
