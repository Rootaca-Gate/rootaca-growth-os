export type LevelCode = 'EXPLORER' | 'BEGINNER' | 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';
export type SkillCode =
  | 'PROGRAMMING_FUNDAMENTALS'
  | 'PROBLEM_SOLVING'
  | 'TECHNICAL_KNOWLEDGE'
  | 'PRACTICAL_SKILLS'
  | 'COMMUNICATION'
  | 'DEBUGGING'
  | 'GIT_GITHUB'
  | 'PROJECT_DEVELOPMENT'
  | 'COMPUTER_SCIENCE_BASICS'
  | 'INDEPENDENCE';
export type PathCode = 'WEB' | 'MOBILE' | 'DATA' | 'GAME' | 'GENERAL';

export type LevelRule = {
  id: string;
  minScore: number;
  maxScore: number;
  source: string;
};

export type Level = {
  id: string;
  code: LevelCode;
  name: string;
  description: string;
  sortOrder: number;
  rules?: LevelRule[];
};

export type Skill = {
  id: string;
  code: SkillCode;
  name: string;
  description: string;
  sortOrder: number;
};

export type PathSkill = {
  skillId: string;
  skillCode: SkillCode;
  skillName: string;
  weightPercent: number;
};

export type LearningPath = {
  id: string;
  code: PathCode;
  name: string;
  description: string;
  sortOrder: number;
  skills?: PathSkill[];
};

export type StudentSkill = {
  skillId: string;
  code: SkillCode;
  name: string;
  score: number;
};

export type Actor = {
  id: string;
  displayName: string;
};

export type Placement = {
  id: string;
  studentId: string;
  assessmentResultId: string;
  systemLevel: Level;
  finalLevel: Level;
  systemPath: LearningPath;
  finalPath: LearningPath;
  alternativePath: LearningPath;
  recommendationReasons: string[];
  alternativeReasons: string[];
  levelChangedBy?: Actor | null;
  pathChangedBy?: Actor | null;
  levelOverrideReason?: string | null;
  pathOverrideReason?: string | null;
  levelChangedAt?: string | null;
  pathChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
