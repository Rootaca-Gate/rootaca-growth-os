import { Project, ProjectMilestone, Student, StudentProject } from '@prisma/client';
import { parseDateOnly, toDateOnly } from '../roadmap/roadmap-progress';
import {
  ProjectDefinitionDto,
  ProjectMilestoneDto,
  StudentProjectDto,
} from './dto/project-response.dto';

export const studentProjectInclude = {
  project: true,
  student: { select: { id: true, fullName: true } },
  milestones: { orderBy: { sortOrder: 'asc' as const } },
};

export type StudentProjectRecord = StudentProject & {
  project: Project;
  student: Pick<Student, 'id' | 'fullName'>;
  milestones: ProjectMilestone[];
};

export function toProjectDto(project: Project, assignmentCount = 0): ProjectDefinitionDto {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    learningGoal: project.learningGoal,
    purpose: project.purpose,
    path: project.path,
    level: project.level,
    durationDays: project.durationDays,
    active: project.active,
    sortOrder: project.sortOrder,
    assignmentCount,
  };
}

export function toMilestoneDto(milestone: ProjectMilestone): ProjectMilestoneDto {
  return {
    id: milestone.id,
    kind: milestone.kind,
    title: milestone.title,
    description: milestone.description,
    sortOrder: milestone.sortOrder,
    completionPercent: milestone.completionPercent,
    status: milestone.status,
    dueDate: milestone.dueDate ? toDateOnly(milestone.dueDate) : null,
    mentorFeedback: milestone.mentorFeedback,
  };
}

export function toStudentProjectDto(item: StudentProjectRecord): StudentProjectDto {
  return {
    id: item.id,
    studentId: item.student.id,
    studentName: item.student.fullName,
    project: toProjectDto(item.project),
    status: item.status,
    progressPercent: item.progressPercent,
    assignedAt: item.assignedAt.toISOString(),
    dueDate: item.dueDate ? toDateOnly(item.dueDate) : null,
    notes: item.notes,
    milestones: item.milestones.map(toMilestoneDto),
  };
}

export function optionalDate(value?: string | null): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  return parseDateOnly(value);
}
