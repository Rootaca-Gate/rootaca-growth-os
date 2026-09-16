import { PathCode, ProgrammingExperience, SkillCode } from '@prisma/client';
import { recommendPath } from './path-recommender';
import { StudentSkillScore } from './skill-calculator';

const balanced: StudentSkillScore[] = Object.values(SkillCode).map((code) => ({
  code,
  score: 50,
}));

describe('path recommender', () => {
  it('recommends games from interests and goal', () => {
    const result = recommendPath({
      interests: ['Games', 'Web'],
      learningGoal: 'Build a first game and understand Python basics.',
      experience: ProgrammingExperience.BEGINNER,
      currentPath: PathCode.GENERAL,
      skills: balanced,
    });

    expect(result.primary).toBe(PathCode.GAME);
    expect(result.alternative).not.toBe(PathCode.GAME);
    expect(result.primaryReasons.join(' ')).toMatch(/game/i);
  });

  it('recommends web from website goals', () => {
    const result = recommendPath({
      interests: ['Web'],
      learningGoal: 'Ship a personal website and start frontend projects.',
      experience: ProgrammingExperience.INTERMEDIATE,
      currentPath: PathCode.WEB,
      skills: balanced,
    });

    expect(result.primary).toBe(PathCode.WEB);
    expect(result.alternative).toBeDefined();
  });

  it('recommends data from AI and SQL signals', () => {
    const result = recommendPath({
      interests: ['AI', 'Data'],
      learningGoal: 'Build data projects and prepare for a CS track.',
      experience: ProgrammingExperience.ADVANCED,
      currentPath: PathCode.DATA,
      skills: balanced.map((item) =>
        item.code === SkillCode.PROBLEM_SOLVING ? { ...item, score: 95 } : item,
      ),
    });

    expect(result.primary).toBe(PathCode.DATA);
  });

  it('recommends mobile from app and dart signals', () => {
    const result = recommendPath({
      interests: ['Mobile', 'Design'],
      learningGoal: 'Create a simple mobile app with a mentor.',
      experience: ProgrammingExperience.BEGINNER,
      currentPath: PathCode.MOBILE,
      skills: balanced,
    });

    expect(result.primary).toBe(PathCode.MOBILE);
  });

  it('prefers general for no experience and exploratory goals', () => {
    const result = recommendPath({
      interests: ['Robotics'],
      learningGoal: 'Discover programming through visual tools.',
      experience: ProgrammingExperience.NONE,
      currentPath: PathCode.GENERAL,
      skills: balanced.map((item) => ({ ...item, score: 20 })),
    });

    expect(result.primary).toBe(PathCode.GENERAL);
    expect(result.alternative).not.toBe(PathCode.GENERAL);
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      interests: ['Web', 'Games'],
      learningGoal: 'Learn web fundamentals and ship a first project.',
      experience: ProgrammingExperience.BEGINNER,
      currentPath: PathCode.WEB,
      skills: balanced,
    };

    expect(recommendPath(input)).toEqual(recommendPath(input));
  });
});
