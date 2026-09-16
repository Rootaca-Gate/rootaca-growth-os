import { ProgrammingExperience, SkillCode } from '@prisma/client';
import { calculateSkills } from './skill-calculator';

describe('skill calculator', () => {
  const categories = [
    { code: 'PROGRAMMING_FUNDAMENTALS', score: 80 },
    { code: 'PROBLEM_SOLVING', score: 60 },
    { code: 'TECHNICAL_KNOWLEDGE', score: 40 },
    { code: 'PRACTICAL_SKILLS', score: 100 },
    { code: 'COMMUNICATION_LEARNING', score: 50 },
  ];

  it('copies category scores into the matching skills', () => {
    const skills = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [],
      experience: ProgrammingExperience.BEGINNER,
    });

    expect(score(skills, SkillCode.PROGRAMMING_FUNDAMENTALS)).toBe(80);
    expect(score(skills, SkillCode.PROBLEM_SOLVING)).toBe(60);
    expect(score(skills, SkillCode.TECHNICAL_KNOWLEDGE)).toBe(40);
    expect(score(skills, SkillCode.PRACTICAL_SKILLS)).toBe(100);
    expect(score(skills, SkillCode.COMMUNICATION)).toBe(50);
  });

  it('uses the debugging assessment skill when present', () => {
    const skills = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [{ key: 'debugging', score: 91 }],
      experience: ProgrammingExperience.NONE,
    });

    expect(score(skills, SkillCode.DEBUGGING)).toBe(91);
  });

  it('derives debugging from problem solving and fundamentals when missing', () => {
    const skills = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [],
      experience: ProgrammingExperience.NONE,
    });

    expect(score(skills, SkillCode.DEBUGGING)).toBe(66);
  });

  it('raises Git/GitHub with more experience', () => {
    const beginner = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [{ key: 'tools', score: 40 }],
      experience: ProgrammingExperience.BEGINNER,
    });
    const advanced = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [{ key: 'tools', score: 40 }],
      experience: ProgrammingExperience.ADVANCED,
    });

    expect(score(advanced, SkillCode.GIT_GITHUB)).toBeGreaterThan(
      score(beginner, SkillCode.GIT_GITHUB),
    );
  });

  it('averages project and CS inputs', () => {
    const skills = calculateSkills({
      categoryScores: categories,
      assessmentSkills: [
        { key: 'hands-on', score: 80 },
        { key: 'maker-mindset', score: 60 },
        { key: 'variables', score: 100 },
        { key: 'control-flow', score: 80 },
        { key: 'computational-thinking', score: 60 },
      ],
      experience: ProgrammingExperience.INTERMEDIATE,
    });

    expect(score(skills, SkillCode.PROJECT_DEVELOPMENT)).toBe(80);
    expect(score(skills, SkillCode.COMPUTER_SCIENCE_BASICS)).toBe(80);
  });
});

function score(skills: Array<{ code: SkillCode; score: number }>, code: SkillCode): number {
  return skills.find((item) => item.code === code)?.score ?? -1;
}
