import { ProgrammingExperience, SkillCode } from '@prisma/client';
import { EXPERIENCE_GIT_BASE } from './catalog/placement-catalog';
import { roundScore } from '../orientation/scoring/score-engine';

export type CategoryScoreInput = {
  code: string;
  score: number;
};

export type AssessmentSkillInput = {
  key: string;
  score: number;
};

export type StudentSkillScore = {
  code: SkillCode;
  score: number;
};

export function calculateSkills(input: {
  categoryScores: CategoryScoreInput[];
  assessmentSkills: AssessmentSkillInput[];
  experience: ProgrammingExperience;
}): StudentSkillScore[] {
  const category = (code: string) =>
    input.categoryScores.find((item) => item.code === code)?.score ?? 0;
  const skill = (key: string) => input.assessmentSkills.find((item) => item.key === key)?.score;

  const pf = category('PROGRAMMING_FUNDAMENTALS');
  const ps = category('PROBLEM_SOLVING');
  const tk = category('TECHNICAL_KNOWLEDGE');
  const practical = category('PRACTICAL_SKILLS');
  const communication = category('COMMUNICATION_LEARNING');
  const tools = skill('tools') ?? practical;
  const debugging = skill('debugging') ?? roundScore(ps * 0.7 + pf * 0.3);

  const git = clamp(EXPERIENCE_GIT_BASE[input.experience] * 0.6 + tools * 0.25 + tk * 0.15);

  return [
    { code: SkillCode.PROGRAMMING_FUNDAMENTALS, score: clamp(pf) },
    { code: SkillCode.PROBLEM_SOLVING, score: clamp(ps) },
    { code: SkillCode.TECHNICAL_KNOWLEDGE, score: clamp(tk) },
    { code: SkillCode.PRACTICAL_SKILLS, score: clamp(practical) },
    { code: SkillCode.COMMUNICATION, score: clamp(communication) },
    { code: SkillCode.DEBUGGING, score: clamp(debugging) },
    { code: SkillCode.GIT_GITHUB, score: git },
    {
      code: SkillCode.PROJECT_DEVELOPMENT,
      score: average([skill('hands-on'), skill('maker-mindset'), practical]),
    },
    {
      code: SkillCode.COMPUTER_SCIENCE_BASICS,
      score: average([
        skill('variables'),
        skill('control-flow'),
        skill('computational-thinking'),
        pf,
      ]),
    },
    {
      code: SkillCode.INDEPENDENCE,
      score: average([skill('resilience'), skill('collaboration'), skill('learning-style')]),
    },
  ];
}

function average(values: Array<number | undefined>): number {
  const present = values.filter((value): value is number => value !== undefined);
  if (present.length === 0) {
    return 0;
  }
  return clamp(present.reduce((sum, value) => sum + value, 0) / present.length);
}

function clamp(value: number): number {
  return roundScore(Math.min(100, Math.max(0, value)));
}
