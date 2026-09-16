export type PathCode = 'WEB' | 'MOBILE' | 'DATA' | 'GAME' | 'GENERAL';
export type LevelCode = 'EXPLORER' | 'BEGINNER' | 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';
export type ProjectPurpose = 'EDUCATIONAL';
export type StudentProjectStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type MilestoneKind =
  | 'PLANNING'
  | 'UI_UX'
  | 'FRONTEND'
  | 'BACKEND'
  | 'DATABASE'
  | 'TESTING'
  | 'DEPLOYMENT'
  | 'PRESENTATION';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type EducationalProject = {
  id: string;
  code: string;
  name: string;
  description: string;
  learningGoal: string;
  purpose: ProjectPurpose;
  path: PathCode;
  level: LevelCode;
  durationDays: number;
  active: boolean;
  sortOrder: number;
  assignmentCount: number;
};

export type ProjectMilestone = {
  id: string;
  kind: MilestoneKind;
  title: string;
  description: string;
  sortOrder: number;
  completionPercent: number;
  status: MilestoneStatus;
  dueDate: string | null;
  mentorFeedback: string;
};

export type StudentProject = {
  id: string;
  studentId: string;
  studentName: string;
  project: EducationalProject;
  status: StudentProjectStatus;
  progressPercent: number;
  assignedAt: string;
  dueDate: string | null;
  notes: string;
  milestones: ProjectMilestone[];
};

export type StudentProjectSummary = {
  studentId: string;
  overallPercent: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  items: StudentProject[];
};

export type ProjectDetails = EducationalProject & {
  assignments: StudentProject[];
};

export type UpsertProjectPayload = {
  code?: string;
  name: string;
  description: string;
  learningGoal: string;
  path: PathCode;
  level: LevelCode;
  durationDays: number;
};

export type AssignProjectPayload = {
  studentId: string;
  dueDate?: string;
  notes?: string;
};

export type UpdateStudentProjectPayload = {
  status?: StudentProjectStatus;
  dueDate?: string | null;
  notes?: string;
};

export type UpdateMilestonePayload = {
  completionPercent?: number;
  status?: MilestoneStatus;
  dueDate?: string | null;
  mentorFeedback?: string;
};
