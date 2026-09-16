export type RoadmapItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type RoadmapSkill = {
  id: string;
  code: string;
  name: string;
};

export type RoadmapItem = {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  skill?: RoadmapSkill | null;
  durationDays: number;
  startDate?: string | null;
  dueDate?: string | null;
  status: RoadmapItemStatus;
  completionPercentage: number;
  projectId?: string | null;
  notes: string;
  sortOrder: number;
};

export type PhaseProgress = {
  phaseId: string;
  title: string;
  percent: number;
  completedCount: number;
  itemCount: number;
  blockedCount: number;
};

export type RoadmapProgress = {
  overallPercent: number;
  itemCount: number;
  completedCount: number;
  inProgressCount: number;
  blockedCount: number;
  phases: PhaseProgress[];
  blockedItems: RoadmapItem[];
};

export type RoadmapPhase = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  progressPercent: number;
  items: RoadmapItem[];
};

export type StudentRoadmap = {
  id: string;
  studentId: string;
  pathId: string;
  pathCode: string;
  pathName: string;
  levelId: string;
  levelCode: string;
  levelName: string;
  templateId?: string | null;
  generatedAt: string;
  progress: RoadmapProgress;
  phases: RoadmapPhase[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePhasePayload = {
  title: string;
  description: string;
};

export type CreateItemPayload = {
  title: string;
  description: string;
  skillId?: string | null;
  durationDays?: number;
  startDate?: string;
  dueDate?: string;
  status?: RoadmapItemStatus;
  completionPercentage?: number;
  notes?: string;
};

export type UpdateItemPayload = Partial<CreateItemPayload> & {
  phaseId?: string;
  skillId?: string | null;
  projectId?: string | null;
};
