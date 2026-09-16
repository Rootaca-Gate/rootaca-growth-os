import { PathCode, ProgrammingExperience, SkillCode } from '@prisma/client';
import { PATH_CATALOG, PATH_SKILL_WEIGHTS } from './catalog/placement-catalog';
import { roundScore } from '../orientation/scoring/score-engine';
import { StudentSkillScore } from './skill-calculator';

export type PathRecommendation = {
  primary: PathCode;
  alternative: PathCode;
  scores: Record<PathCode, number>;
  primaryReasons: string[];
  alternativeReasons: string[];
};

const PATH_ORDER: PathCode[] = PATH_CATALOG.map((item) => item.code);

export function recommendPath(input: {
  interests: string[];
  learningGoal: string;
  experience: ProgrammingExperience;
  currentPath: PathCode;
  skills: StudentSkillScore[];
}): PathRecommendation {
  const details = PATH_ORDER.map((code) => scorePath(code, input));
  const ranked = [...details].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return PATH_ORDER.indexOf(left.code) - PATH_ORDER.indexOf(right.code);
  });

  const primary = ranked[0] ?? details[0];
  const alternative =
    ranked.find((item) => item.code !== primary?.code) ?? ranked[1] ?? details[1] ?? primary;

  const scores = Object.fromEntries(details.map((item) => [item.code, item.score])) as Record<
    PathCode,
    number
  >;

  return {
    primary: primary.code,
    alternative: alternative.code,
    scores,
    primaryReasons: primary.reasons,
    alternativeReasons: alternative.reasons,
  };
}

function scorePath(
  code: PathCode,
  input: {
    interests: string[];
    learningGoal: string;
    experience: ProgrammingExperience;
    currentPath: PathCode;
    skills: StudentSkillScore[];
  },
): { code: PathCode; score: number; reasons: string[] } {
  const reasons: string[] = [];
  const interestScore = scoreInterests(code, input.interests, reasons);
  const goalScore = scoreGoal(code, input.learningGoal, reasons);
  const skillScore = scoreSkills(code, input.skills, reasons);
  const experienceScore = scoreExperience(code, input.experience, input.currentPath, reasons);

  const score = roundScore(
    interestScore * 0.35 + goalScore * 0.2 + skillScore * 0.3 + experienceScore * 0.15,
  );

  return { code, score, reasons: reasons.slice(0, 4) };
}

function scoreInterests(code: PathCode, interests: string[], reasons: string[]): number {
  const text = interests.join(' ').toLowerCase();
  const hits: Array<[RegExp, PathCode, number, string]> = [
    [/\bweb\b|website|frontend|html|css/, PathCode.WEB, 90, 'Interests include web'],
    [/\bmobile\b|app|flutter|dart|android|ios/, PathCode.MOBILE, 90, 'Interests include mobile'],
    [/\bdata\b|\bai\b|sql|python|analytics/, PathCode.DATA, 90, 'Interests include data'],
    [/\bgame\b|games|sprite|unity|play/, PathCode.GAME, 90, 'Interests include games'],
    [/robot|general|explore/, PathCode.GENERAL, 70, 'Interests point to broad exploration'],
  ];

  let score = code === PathCode.GENERAL ? 35 : 15;
  for (const [pattern, path, value, reason] of hits) {
    if (path === code && pattern.test(text)) {
      score = Math.max(score, value);
      reasons.push(reason);
    }
  }
  return score;
}

function scoreGoal(code: PathCode, learningGoal: string, reasons: string[]): number {
  const text = learningGoal.toLowerCase();
  const hits: Array<[RegExp, PathCode, string]> = [
    [/web|website|frontend|html|css|javascript/, PathCode.WEB, 'Goal mentions web work'],
    [/mobile|app|flutter|dart|phone/, PathCode.MOBILE, 'Goal mentions a mobile app'],
    [/data|sql|ai|dataset|analysis/, PathCode.DATA, 'Goal mentions data or analysis'],
    [/game|sprite|unity|playable/, PathCode.GAME, 'Goal mentions games'],
    [/explor|discover|foundat|general/, PathCode.GENERAL, 'Goal is still exploratory'],
  ];

  let score = 20;
  for (const [pattern, path, reason] of hits) {
    if (path === code && pattern.test(text)) {
      score = 95;
      reasons.push(reason);
    }
  }
  return score;
}

function scoreSkills(code: PathCode, skills: StudentSkillScore[], reasons: string[]): number {
  const weights = PATH_SKILL_WEIGHTS[code];
  const byCode = Object.fromEntries(skills.map((item) => [item.code, item.score]));
  let total = 0;
  let strongest: { name: SkillCode; score: number } | undefined;

  for (const [skillCode, weight] of Object.entries(weights)) {
    const value = byCode[skillCode as SkillCode] ?? 0;
    total += ((weight ?? 0) / 100) * value;
    if (!strongest || value > strongest.score) {
      strongest = { name: skillCode as SkillCode, score: value };
    }
  }

  if (strongest && strongest.score >= 70) {
    reasons.push(`Strong ${labelSkill(strongest.name)} supports this path`);
  }

  return roundScore(total);
}

function scoreExperience(
  code: PathCode,
  experience: ProgrammingExperience,
  currentPath: PathCode,
  reasons: string[],
): number {
  if (experience === ProgrammingExperience.NONE || experience === ProgrammingExperience.BEGINNER) {
    if (code === PathCode.GENERAL) {
      reasons.push('Limited experience favors a general foundation');
      return 85;
    }
    return 35;
  }

  if (code === currentPath) {
    reasons.push('Current path matches existing experience');
    return 80;
  }

  return code === PathCode.GENERAL ? 30 : 55;
}

function labelSkill(code: SkillCode): string {
  return code.replaceAll('_', ' ').toLowerCase();
}
