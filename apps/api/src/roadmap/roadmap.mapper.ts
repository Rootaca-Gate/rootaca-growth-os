import {
  LearningPath,
  Level,
  Prisma,
  Roadmap,
  RoadmapItem,
  RoadmapItemStatus,
  RoadmapPhase,
  RoadmapTemplate,
  RoadmapTemplateItem,
  RoadmapTemplatePhase,
  Skill,
} from '@prisma/client';
import {
  PhaseProgressDto,
  RoadmapItemResponseDto,
  RoadmapPhaseResponseDto,
  RoadmapProgressDto,
  RoadmapResponseDto,
  RoadmapSkillDto,
  RoadmapTemplateItemResponseDto,
  RoadmapTemplateResponseDto,
} from './dto/roadmap-response.dto';
import { averagePercent, toDateOnly } from './roadmap-progress';

export const roadmapInclude = {
  path: true,
  level: true,
  phases: {
    orderBy: { sortOrder: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { skill: true },
      },
    },
  },
} satisfies Prisma.RoadmapInclude;

export const templateInclude = {
  path: true,
  level: true,
  phases: {
    orderBy: { sortOrder: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { skill: true },
      },
    },
  },
} satisfies Prisma.RoadmapTemplateInclude;

export type RoadmapRecord = Roadmap & {
  path: LearningPath;
  level: Level;
  phases: Array<RoadmapPhase & { items: Array<RoadmapItem & { skill: Skill | null }> }>;
};

export type TemplateRecord = RoadmapTemplate & {
  path: LearningPath;
  level: Level;
  phases: Array<RoadmapTemplatePhase & { items: Array<RoadmapTemplateItem & { skill: Skill }> }>;
};

export function toSkillDto(skill: Skill): RoadmapSkillDto {
  return { id: skill.id, code: skill.code, name: skill.name };
}

export function toItemResponse(
  item: RoadmapItem & { skill: Skill | null },
): RoadmapItemResponseDto {
  return {
    id: item.id,
    phaseId: item.phaseId,
    title: item.title,
    description: item.description,
    skill: item.skill ? toSkillDto(item.skill) : null,
    durationDays: item.durationDays,
    startDate: item.startDate ? toDateOnly(item.startDate) : null,
    dueDate: item.dueDate ? toDateOnly(item.dueDate) : null,
    status: item.status,
    completionPercentage: item.completionPercentage,
    projectId: item.projectId,
    notes: item.notes,
    sortOrder: item.sortOrder,
  };
}

export function toProgress(roadmap: RoadmapRecord): RoadmapProgressDto {
  const items = roadmap.phases.flatMap((phase) => phase.items);
  const phases: PhaseProgressDto[] = roadmap.phases.map((phase) => ({
    phaseId: phase.id,
    title: phase.title,
    percent: averagePercent(phase.items),
    completedCount: phase.items.filter((item) => item.status === RoadmapItemStatus.COMPLETED)
      .length,
    itemCount: phase.items.length,
    blockedCount: phase.items.filter((item) => item.status === RoadmapItemStatus.BLOCKED).length,
  }));

  return {
    overallPercent: averagePercent(items),
    itemCount: items.length,
    completedCount: items.filter((item) => item.status === RoadmapItemStatus.COMPLETED).length,
    inProgressCount: items.filter((item) => item.status === RoadmapItemStatus.IN_PROGRESS).length,
    blockedCount: items.filter((item) => item.status === RoadmapItemStatus.BLOCKED).length,
    phases,
    blockedItems: items
      .filter((item) => item.status === RoadmapItemStatus.BLOCKED)
      .map(toItemResponse),
  };
}

export function toPhaseResponse(phase: RoadmapRecord['phases'][number]): RoadmapPhaseResponseDto {
  return {
    id: phase.id,
    title: phase.title,
    description: phase.description,
    sortOrder: phase.sortOrder,
    progressPercent: averagePercent(phase.items),
    items: phase.items.map(toItemResponse),
  };
}

export function toRoadmapResponse(roadmap: RoadmapRecord): RoadmapResponseDto {
  return {
    id: roadmap.id,
    studentId: roadmap.studentId,
    pathId: roadmap.pathId,
    pathCode: roadmap.path.code,
    pathName: roadmap.path.name,
    levelId: roadmap.levelId,
    levelCode: roadmap.level.code,
    levelName: roadmap.level.name,
    templateId: roadmap.templateId,
    generatedAt: roadmap.generatedAt.toISOString(),
    progress: toProgress(roadmap),
    phases: roadmap.phases.map(toPhaseResponse),
    createdAt: roadmap.createdAt.toISOString(),
    updatedAt: roadmap.updatedAt.toISOString(),
  };
}

export function toTemplateItemResponse(
  item: RoadmapTemplateItem & { skill: Skill },
): RoadmapTemplateItemResponseDto {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    skill: toSkillDto(item.skill),
    durationDays: item.durationDays,
    sortOrder: item.sortOrder,
  };
}

export function toTemplateResponse(template: TemplateRecord): RoadmapTemplateResponseDto {
  return {
    id: template.id,
    pathId: template.pathId,
    pathCode: template.path.code,
    pathName: template.path.name,
    levelId: template.levelId,
    levelCode: template.level.code,
    levelName: template.level.name,
    name: template.name,
    description: template.description,
    phases: template.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      description: phase.description,
      sortOrder: phase.sortOrder,
      items: phase.items.map(toTemplateItemResponse),
    })),
  };
}
