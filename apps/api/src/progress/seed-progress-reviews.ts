import { PrismaClient, ReviewKind } from '@prisma/client';
import { overallReviewScore, scoresFromReview } from './progress-growth';

const YARA_PHONE = '+201000000001';
const MENTOR_EMAIL = 'mentor@rootaca.com';

export async function seedProgressReviews(prisma: PrismaClient): Promise<void> {
  const [student, mentor] = await Promise.all([
    prisma.student.findFirst({ where: { phone: YARA_PHONE } }),
    prisma.user.findUnique({ where: { email: MENTOR_EMAIL } }),
  ]);
  if (!student || !mentor) {
    return;
  }

  await prisma.progressReview.deleteMany({ where: { studentId: student.id } });

  const initialScores = scoresFromReview({
    technicalSkills: 40,
    problemSolving: 30,
    projects: 20,
    independence: 35,
    communication: 50,
  });
  const monthlyScores = scoresFromReview({
    technicalSkills: 55,
    problemSolving: 45,
    projects: 40,
    independence: 50,
    communication: 60,
  });

  await prisma.progressReview.create({
    data: {
      studentId: student.id,
      reviewerId: mentor.id,
      kind: ReviewKind.INITIAL_ASSESSMENT,
      reviewedAt: new Date('2026-08-01T00:00:00.000Z'),
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T00:00:00.000Z'),
      ...initialScores,
      overallScore: overallReviewScore(initialScores),
      kpiOverallPercent: 8,
      projectOverallPercent: 0,
      notes: 'Baseline classroom review after intake.',
      strengths: 'Asks clear questions and stays curious.',
      nextFocus: 'Plan a first practice page with a mentor.',
    },
  });

  await prisma.progressReview.create({
    data: {
      studentId: student.id,
      reviewerId: mentor.id,
      kind: ReviewKind.MONTHLY_REVIEW,
      reviewedAt: new Date('2026-09-16T00:00:00.000Z'),
      periodStart: new Date('2026-09-01T00:00:00.000Z'),
      periodEnd: new Date('2026-09-30T00:00:00.000Z'),
      ...monthlyScores,
      overallScore: overallReviewScore(monthlyScores),
      kpiOverallPercent: 18,
      projectOverallPercent: 6,
      notes: 'Stronger planning and more independent debugging.',
      strengths: 'Can explain what the practice page should do.',
      nextFocus: 'Finish UI/UX sketches before frontend work.',
    },
  });
}
