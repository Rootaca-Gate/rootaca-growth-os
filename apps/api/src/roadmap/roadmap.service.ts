import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoadmapItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoadmapItemDto,
  CreateRoadmapPhaseDto,
  UpdateRoadmapPhaseDto,
  UpsertRoadmapItemDto,
} from './dto/roadmap-write.dto';
import { RoadmapResponseDto, RoadmapTemplateResponseDto } from './dto/roadmap-response.dto';
import {
  roadmapInclude,
  RoadmapRecord,
  templateInclude,
  toRoadmapResponse,
  toTemplateResponse,
} from './roadmap.mapper';
import { addUtcDays, normalizeItemProgress, parseDateOnly, toDateOnly } from './roadmap-progress';

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(): Promise<RoadmapTemplateResponseDto[]> {
    const templates = await this.prisma.roadmapTemplate.findMany({
      include: templateInclude,
      orderBy: [{ path: { sortOrder: 'asc' } }, { level: { sortOrder: 'asc' } }],
    });
    return templates.map(toTemplateResponse);
  }

  async syncForStudent(studentId: string): Promise<RoadmapResponseDto | null> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { roadmap: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.currentPathId || !student.currentLevelId) {
      return student.roadmap ? this.getById(student.roadmap.id) : null;
    }

    if (
      student.roadmap &&
      student.roadmap.pathId === student.currentPathId &&
      student.roadmap.levelId === student.currentLevelId
    ) {
      return this.getById(student.roadmap.id);
    }

    return this.generate(studentId, { replace: Boolean(student.roadmap) });
  }

  async getForStudent(studentId: string): Promise<RoadmapResponseDto> {
    const roadmap = await this.syncForStudent(studentId);
    if (!roadmap) {
      throw new NotFoundException(
        'Roadmap is not available until a learning path and level are selected',
      );
    }
    return roadmap;
  }

  async generate(
    studentId: string,
    options: { replace?: boolean } = {},
  ): Promise<RoadmapResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { roadmap: true, currentPath: true, currentLevel: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const pathId = student.currentPathId;
    const levelId = student.currentLevelId;

    if (!pathId || !levelId) {
      throw new ConflictException('Select a learning path and level before generating a roadmap');
    }

    if (student.roadmap && !options.replace) {
      if (student.roadmap.pathId === pathId && student.roadmap.levelId === levelId) {
        return this.getById(student.roadmap.id);
      }
    }

    const template = await this.prisma.roadmapTemplate.findUnique({
      where: {
        pathId_levelId: { pathId, levelId },
      },
      include: templateInclude,
    });

    if (!template) {
      throw new BadRequestException('No roadmap template exists for this path and level');
    }

    const start = parseDateOnly(toDateOnly(new Date()));
    let cursor = start;

    if (student.roadmap) {
      await this.prisma.roadmap.delete({ where: { id: student.roadmap.id } });
    }

    const roadmap = await this.prisma.roadmap.create({
      data: {
        studentId,
        templateId: template.id,
        pathId,
        levelId,
        generatedAt: new Date(),
      },
    });

    for (const phase of template.phases) {
      const createdPhase = await this.prisma.roadmapPhase.create({
        data: {
          roadmapId: roadmap.id,
          title: phase.title,
          description: phase.description,
          sortOrder: phase.sortOrder,
        },
      });

      for (const item of phase.items) {
        const startDate = cursor;
        const dueDate = addUtcDays(startDate, item.durationDays);
        cursor = addUtcDays(dueDate, 1);

        await this.prisma.roadmapItem.create({
          data: {
            phaseId: createdPhase.id,
            title: item.title,
            description: item.description,
            skillId: item.skillId,
            durationDays: item.durationDays,
            startDate,
            dueDate,
            sortOrder: item.sortOrder,
          },
        });
      }
    }

    return this.getById(roadmap.id);
  }

  async addPhase(studentId: string, dto: CreateRoadmapPhaseDto): Promise<RoadmapResponseDto> {
    const roadmap = await this.requireRoadmap(studentId);
    const sortOrder = (roadmap.phases.at(-1)?.sortOrder ?? 0) + 1;
    await this.prisma.roadmapPhase.create({
      data: {
        roadmapId: roadmap.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        sortOrder,
      },
    });
    return this.getById(roadmap.id);
  }

  async updatePhase(
    studentId: string,
    phaseId: string,
    dto: UpdateRoadmapPhaseDto,
  ): Promise<RoadmapResponseDto> {
    const phase = await this.requirePhase(studentId, phaseId);
    await this.prisma.roadmapPhase.update({
      where: { id: phase.id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
      },
    });
    return this.getById(phase.roadmapId);
  }

  async removePhase(studentId: string, phaseId: string): Promise<RoadmapResponseDto> {
    const phase = await this.requirePhase(studentId, phaseId);
    await this.prisma.roadmapPhase.delete({ where: { id: phase.id } });
    return this.resequencePhases(phase.roadmapId);
  }

  async reorderPhases(studentId: string, ids: string[]): Promise<RoadmapResponseDto> {
    const roadmap = await this.requireRoadmap(studentId);
    this.assertIdSet(
      ids,
      roadmap.phases.map((phase) => phase.id),
      'phase',
    );

    for (const [index, id] of ids.entries()) {
      await this.prisma.roadmapPhase.update({
        where: { id },
        data: { sortOrder: index + 1 },
      });
    }

    return this.getById(roadmap.id);
  }

  async addItem(
    studentId: string,
    phaseId: string,
    dto: CreateRoadmapItemDto,
  ): Promise<RoadmapResponseDto> {
    const phase = await this.requirePhase(studentId, phaseId);
    const lastItem = phase.items.at(-1);
    const durationDays = dto.durationDays ?? 7;
    const startDate = dto.startDate
      ? parseDateOnly(dto.startDate)
      : lastItem?.dueDate
        ? addUtcDays(lastItem.dueDate, 1)
        : parseDateOnly(toDateOnly(new Date()));
    const dueDate = dto.dueDate ? parseDateOnly(dto.dueDate) : addUtcDays(startDate, durationDays);
    const progress = normalizeItemProgress({
      status: dto.status,
      completionPercentage: dto.completionPercentage,
      currentStatus: RoadmapItemStatus.NOT_STARTED,
      currentPercent: 0,
    });

    await this.prisma.roadmapItem.create({
      data: {
        phaseId: phase.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        skillId: dto.skillId ?? null,
        durationDays,
        startDate,
        dueDate,
        status: progress.status,
        completionPercentage: progress.completionPercentage,
        projectId: dto.projectId ?? null,
        notes: dto.notes?.trim() ?? '',
        sortOrder: (lastItem?.sortOrder ?? 0) + 1,
      },
    });

    return this.getById(phase.roadmapId);
  }

  async updateItem(
    studentId: string,
    itemId: string,
    dto: UpsertRoadmapItemDto,
  ): Promise<RoadmapResponseDto> {
    const item = await this.requireItem(studentId, itemId);
    const targetPhaseId = dto.phaseId ?? item.phaseId;
    if (dto.phaseId && dto.phaseId !== item.phaseId) {
      await this.requirePhase(studentId, dto.phaseId);
    }

    const durationDays = dto.durationDays ?? item.durationDays;
    const startDate =
      dto.startDate === undefined
        ? item.startDate
        : dto.startDate
          ? parseDateOnly(dto.startDate)
          : null;
    let dueDate =
      dto.dueDate === undefined ? item.dueDate : dto.dueDate ? parseDateOnly(dto.dueDate) : null;

    if (startDate && !dueDate) {
      dueDate = addUtcDays(startDate, durationDays);
    }

    if (startDate && dueDate && dueDate < startDate) {
      throw new BadRequestException('Due date cannot be before start date');
    }

    const progress = normalizeItemProgress({
      status: dto.status,
      completionPercentage: dto.completionPercentage,
      currentStatus: item.status,
      currentPercent: item.completionPercentage,
    });

    await this.prisma.roadmapItem.update({
      where: { id: item.id },
      data: {
        phaseId: targetPhaseId,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        skillId: dto.skillId === undefined ? undefined : dto.skillId,
        durationDays,
        startDate,
        dueDate,
        status: progress.status,
        completionPercentage: progress.completionPercentage,
        projectId: dto.projectId === undefined ? undefined : dto.projectId,
        notes: dto.notes === undefined ? undefined : dto.notes.trim(),
        sortOrder:
          dto.phaseId && dto.phaseId !== item.phaseId
            ? await this.nextItemSort(dto.phaseId)
            : undefined,
      },
    });

    return this.getById(item.phase.roadmapId);
  }

  async removeItem(studentId: string, itemId: string): Promise<RoadmapResponseDto> {
    const item = await this.requireItem(studentId, itemId);
    await this.prisma.roadmapItem.delete({ where: { id: item.id } });
    return this.resequenceItems(item.phaseId, item.phase.roadmapId);
  }

  async reorderItems(
    studentId: string,
    phaseId: string,
    ids: string[],
  ): Promise<RoadmapResponseDto> {
    const phase = await this.requirePhase(studentId, phaseId);
    this.assertIdSet(
      ids,
      phase.items.map((item) => item.id),
      'item',
    );

    for (const [index, id] of ids.entries()) {
      await this.prisma.roadmapItem.update({
        where: { id },
        data: { sortOrder: index + 1 },
      });
    }

    return this.getById(phase.roadmapId);
  }

  private async getById(id: string): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { id },
      include: roadmapInclude,
    });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    return toRoadmapResponse(roadmap);
  }

  private async requireRoadmap(studentId: string): Promise<RoadmapRecord> {
    await this.ensureStudent(studentId);
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { studentId },
      include: roadmapInclude,
    });
    if (!roadmap) {
      throw new NotFoundException('Generate a roadmap before editing');
    }
    return roadmap;
  }

  private async requirePhase(studentId: string, phaseId: string) {
    const phase = await this.prisma.roadmapPhase.findUnique({
      where: { id: phaseId },
      include: {
        roadmap: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!phase || phase.roadmap.studentId !== studentId) {
      throw new NotFoundException('Roadmap phase not found');
    }
    return phase;
  }

  private async requireItem(studentId: string, itemId: string) {
    const item = await this.prisma.roadmapItem.findUnique({
      where: { id: itemId },
      include: { phase: { include: { roadmap: true } }, skill: true },
    });
    if (!item || item.phase.roadmap.studentId !== studentId) {
      throw new NotFoundException('Roadmap item not found');
    }
    return item;
  }

  private async ensureStudent(studentId: string): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
  }

  private assertIdSet(ids: string[], existing: string[], label: string): void {
    if (ids.length !== existing.length || new Set(ids).size !== ids.length) {
      throw new BadRequestException(`Provide every ${label} id exactly once`);
    }
    const known = new Set(existing);
    if (ids.some((id) => !known.has(id))) {
      throw new BadRequestException(`${label} list does not match the roadmap`);
    }
  }

  private async nextItemSort(phaseId: string): Promise<number> {
    const last = await this.prisma.roadmapItem.findFirst({
      where: { phaseId },
      orderBy: { sortOrder: 'desc' },
    });
    return (last?.sortOrder ?? 0) + 1;
  }

  private async resequencePhases(roadmapId: string): Promise<RoadmapResponseDto> {
    const phases = await this.prisma.roadmapPhase.findMany({
      where: { roadmapId },
      orderBy: { sortOrder: 'asc' },
    });
    for (const [index, phase] of phases.entries()) {
      await this.prisma.roadmapPhase.update({
        where: { id: phase.id },
        data: { sortOrder: index + 1 },
      });
    }
    return this.getById(roadmapId);
  }

  private async resequenceItems(phaseId: string, roadmapId: string): Promise<RoadmapResponseDto> {
    const items = await this.prisma.roadmapItem.findMany({
      where: { phaseId },
      orderBy: { sortOrder: 'asc' },
    });
    for (const [index, item] of items.entries()) {
      await this.prisma.roadmapItem.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      });
    }
    return this.getById(roadmapId);
  }
}
