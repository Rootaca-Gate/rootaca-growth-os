import {
  LearningPath as CatalogLearningPath,
  Level,
} from '../placement/placement.models';

export type StudentStatus = 'INTAKE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'WITHDRAWN';
export type EnglishLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'FLUENT';
export type ProgrammingExperience = 'NONE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type StudentLevel = 'FOUNDATION' | 'JUNIOR' | 'INTERMEDIATE' | 'ADVANCED';
export type LearningPath = 'WEB' | 'MOBILE' | 'DATA' | 'GAME' | 'GENERAL';

export type Student = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  schoolGrade: string;
  phone: string;
  parentContact: string;
  programmingExperience: ProgrammingExperience;
  programmingLanguages: string[];
  interests: string[];
  learningGoal: string;
  availableHoursPerWeek: number;
  englishLevel: EnglishLevel;
  status: StudentStatus;
  level: StudentLevel;
  path: LearningPath;
  currentLevel?: Level | null;
  currentPath?: CatalogLearningPath | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentWritePayload = Omit<
  Student,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'currentLevel' | 'currentPath'
> & {
  status?: StudentStatus;
};

export type StudentQuery = {
  search?: string;
  status?: StudentStatus | '';
  level?: StudentLevel | '';
  path?: LearningPath | '';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedStudents = {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
