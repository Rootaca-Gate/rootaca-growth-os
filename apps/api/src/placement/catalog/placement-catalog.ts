import { LevelCode, PathCode, SkillCode } from '@prisma/client';

const id = (prefix: string, n: number) =>
  `${prefix}0000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

export const LEVEL_CATALOG = [
  {
    id: id('d', 1),
    code: LevelCode.EXPLORER,
    name: 'Explorer',
    description: 'Early exploration. Focus on confidence, tools, and guided practice.',
    sortOrder: 1,
    minScore: 0,
    maxScore: 29,
  },
  {
    id: id('d', 2),
    code: LevelCode.BEGINNER,
    name: 'Beginner',
    description: 'Can follow examples and complete short guided tasks with support.',
    sortOrder: 2,
    minScore: 30,
    maxScore: 49,
  },
  {
    id: id('d', 3),
    code: LevelCode.FOUNDATION,
    name: 'Foundation',
    description: 'Understands core ideas and can finish simple projects with a mentor.',
    sortOrder: 3,
    minScore: 50,
    maxScore: 69,
  },
  {
    id: id('d', 4),
    code: LevelCode.INTERMEDIATE,
    name: 'Intermediate',
    description: 'Plans, debugs, and ships small projects with increasing independence.',
    sortOrder: 4,
    minScore: 70,
    maxScore: 84,
  },
  {
    id: id('d', 5),
    code: LevelCode.ADVANCED,
    name: 'Advanced',
    description: 'Works independently, explains trade-offs, and is ready for deeper tracks.',
    sortOrder: 5,
    minScore: 85,
    maxScore: 100,
  },
] as const;

export const SKILL_CATALOG = [
  {
    id: id('e', 1),
    code: SkillCode.PROGRAMMING_FUNDAMENTALS,
    name: 'Programming Fundamentals',
    description: 'Variables, control flow, and core coding ideas.',
    sortOrder: 1,
  },
  {
    id: id('e', 2),
    code: SkillCode.PROBLEM_SOLVING,
    name: 'Problem Solving',
    description: 'Decomposition, planning, and working through blockers.',
    sortOrder: 2,
  },
  {
    id: id('e', 3),
    code: SkillCode.TECHNICAL_KNOWLEDGE,
    name: 'Technical Knowledge',
    description: 'Tools, vocabulary, and how software is put together.',
    sortOrder: 3,
  },
  {
    id: id('e', 4),
    code: SkillCode.PRACTICAL_SKILLS,
    name: 'Practical Skills',
    description: 'Hands-on making, setup, and finishing a visible change.',
    sortOrder: 4,
  },
  {
    id: id('e', 5),
    code: SkillCode.COMMUNICATION,
    name: 'Communication',
    description: 'Explaining goals, asking questions, and collaborating.',
    sortOrder: 5,
  },
  {
    id: id('e', 6),
    code: SkillCode.DEBUGGING,
    name: 'Debugging',
    description: 'Finding why something failed and testing a fix.',
    sortOrder: 6,
  },
  {
    id: id('e', 7),
    code: SkillCode.GIT_GITHUB,
    name: 'Git/GitHub',
    description: 'Saving work, sharing, and collaborating with version control.',
    sortOrder: 7,
  },
  {
    id: id('e', 8),
    code: SkillCode.PROJECT_DEVELOPMENT,
    name: 'Project Development',
    description: 'Turning an idea into a small shipped project.',
    sortOrder: 8,
  },
  {
    id: id('e', 9),
    code: SkillCode.COMPUTER_SCIENCE_BASICS,
    name: 'Computer Science Basics',
    description: 'How programs think: sequence, data, and structure.',
    sortOrder: 9,
  },
  {
    id: id('e', 10),
    code: SkillCode.INDEPENDENCE,
    name: 'Independence',
    description: 'Trying another approach and working with less prompting.',
    sortOrder: 10,
  },
] as const;

export const PATH_CATALOG = [
  {
    id: id('f', 1),
    code: PathCode.WEB,
    name: 'Web',
    description: 'Websites, frontend, and browser-based projects.',
    sortOrder: 1,
  },
  {
    id: id('f', 2),
    code: PathCode.MOBILE,
    name: 'Mobile',
    description: 'Phone and tablet apps, including Flutter-style making.',
    sortOrder: 2,
  },
  {
    id: id('f', 3),
    code: PathCode.DATA,
    name: 'Data',
    description: 'Data, Python, SQL, and analysis-oriented projects.',
    sortOrder: 3,
  },
  {
    id: id('f', 4),
    code: PathCode.GAME,
    name: 'Game',
    description: 'Games, sprites, interaction, and playable projects.',
    sortOrder: 4,
  },
  {
    id: id('f', 5),
    code: PathCode.GENERAL,
    name: 'General',
    description: 'A broad foundation before specializing.',
    sortOrder: 5,
  },
] as const;

export const PATH_SKILL_WEIGHTS: Record<PathCode, Partial<Record<SkillCode, number>>> = {
  WEB: {
    PROGRAMMING_FUNDAMENTALS: 15,
    PROBLEM_SOLVING: 10,
    TECHNICAL_KNOWLEDGE: 25,
    PRACTICAL_SKILLS: 15,
    COMMUNICATION: 5,
    DEBUGGING: 10,
    GIT_GITHUB: 10,
    PROJECT_DEVELOPMENT: 10,
  },
  MOBILE: {
    PROGRAMMING_FUNDAMENTALS: 15,
    PROBLEM_SOLVING: 10,
    TECHNICAL_KNOWLEDGE: 20,
    PRACTICAL_SKILLS: 20,
    COMMUNICATION: 5,
    DEBUGGING: 10,
    PROJECT_DEVELOPMENT: 15,
    INDEPENDENCE: 5,
  },
  DATA: {
    PROGRAMMING_FUNDAMENTALS: 15,
    PROBLEM_SOLVING: 25,
    TECHNICAL_KNOWLEDGE: 15,
    COMPUTER_SCIENCE_BASICS: 20,
    DEBUGGING: 10,
    GIT_GITHUB: 5,
    PROJECT_DEVELOPMENT: 10,
  },
  GAME: {
    PROGRAMMING_FUNDAMENTALS: 20,
    PROBLEM_SOLVING: 20,
    PRACTICAL_SKILLS: 20,
    PROJECT_DEVELOPMENT: 15,
    INDEPENDENCE: 10,
    COMMUNICATION: 5,
    DEBUGGING: 10,
  },
  GENERAL: {
    PROGRAMMING_FUNDAMENTALS: 15,
    PROBLEM_SOLVING: 15,
    PRACTICAL_SKILLS: 15,
    COMMUNICATION: 20,
    INDEPENDENCE: 15,
    PROJECT_DEVELOPMENT: 10,
    COMPUTER_SCIENCE_BASICS: 10,
  },
};

export const EXPERIENCE_GIT_BASE: Record<
  'NONE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  number
> = {
  NONE: 10,
  BEGINNER: 28,
  INTERMEDIATE: 52,
  ADVANCED: 72,
};
