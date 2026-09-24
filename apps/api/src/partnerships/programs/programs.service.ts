import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryFormat,
  PartnershipProgramDocumentStatus,
  PartnershipProgramRequirementPriority,
  PartnershipProgramStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  CreateProgramDto,
  PaginatedProgramsDto,
  ProgramListItemDto,
  ProgramResponseDto,
  QueryProgramsDto,
  UpdateProgramDto,
} from './dto/program.dto';

const programInclude = {
  objectives: { orderBy: { sortOrder: 'asc' as const } },
  curriculumModules: { orderBy: { sortOrder: 'asc' as const } },
  activities: { orderBy: { sortOrder: 'asc' as const } },
  sampleProjects: { orderBy: { sortOrder: 'asc' as const } },
  assessmentMethods: { orderBy: { sortOrder: 'asc' as const } },
  deliveryFormats: { orderBy: { format: 'asc' as const } },
  requirements: { orderBy: { sortOrder: 'asc' as const } },
  outcomes: { orderBy: { sortOrder: 'asc' as const } },
  documents: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.PartnershipProgramInclude;

type ProgramWithRelations = Prisma.PartnershipProgramGetPayload<{ include: typeof programInclude }>;

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async create(dto: CreateProgramDto, actorId: string): Promise<ProgramResponseDto> {
    const row = await this.prisma.partnershipProgram.create({
      data: this.buildCreateData(dto),
      include: programInclude,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: row.id,
      action: PartnershipAuditAction.PROGRAM_CREATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async findAll(query: QueryProgramsDto): Promise<PaginatedProgramsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipProgram.count({ where }),
      this.prisma.partnershipProgram.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: { deliveryFormats: { orderBy: { format: 'asc' } } },
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<ProgramResponseDto> {
    const row = await this.prisma.partnershipProgram.findUnique({
      where: { id },
      include: programInclude,
    });
    if (!row) {
      throw new NotFoundException('Program not found');
    }
    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateProgramDto, actorId: string): Promise<ProgramResponseDto> {
    const existing = await this.prisma.partnershipProgram.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Program not found');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.objectives !== undefined) {
        await tx.partnershipProgramObjective.deleteMany({ where: { programId: id } });
      }
      if (dto.curriculumModules !== undefined) {
        await tx.partnershipProgramCurriculumModule.deleteMany({ where: { programId: id } });
      }
      if (dto.activities !== undefined) {
        await tx.partnershipProgramActivity.deleteMany({ where: { programId: id } });
      }
      if (dto.sampleProjects !== undefined) {
        await tx.partnershipProgramSampleProject.deleteMany({ where: { programId: id } });
      }
      if (dto.assessmentMethods !== undefined) {
        await tx.partnershipProgramAssessmentMethod.deleteMany({ where: { programId: id } });
      }
      if (dto.deliveryFormats !== undefined) {
        await tx.partnershipProgramDeliverySupport.deleteMany({ where: { programId: id } });
      }
      if (dto.requirements !== undefined) {
        await tx.partnershipProgramRequirement.deleteMany({ where: { programId: id } });
      }
      if (dto.outcomes !== undefined) {
        await tx.partnershipProgramOutcome.deleteMany({ where: { programId: id } });
      }
      if (dto.documents !== undefined) {
        await tx.partnershipProgramDocument.deleteMany({ where: { programId: id } });
      }

      return tx.partnershipProgram.update({
        where: { id },
        data: this.buildUpdateData(dto),
        include: programInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: id,
      action: PartnershipAuditAction.PROGRAM_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async archive(id: string, actorId: string): Promise<ProgramResponseDto> {
    const existing = await this.prisma.partnershipProgram.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Program not found');
    }

    const row = await this.prisma.partnershipProgram.update({
      where: { id },
      data: { status: PartnershipProgramStatus.ARCHIVED },
      include: programInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: id,
      action: PartnershipAuditAction.PROGRAM_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async duplicate(id: string, actorId: string): Promise<ProgramResponseDto> {
    const source = await this.prisma.partnershipProgram.findUnique({
      where: { id },
      include: programInclude,
    });
    if (!source) {
      throw new NotFoundException('Program not found');
    }

    const copyName = `${source.name} (Copy)`;
    const row = await this.prisma.partnershipProgram.create({
      data: {
        name: copyName,
        shortDescription: source.shortDescription,
        programType: source.programType,
        targetAge: source.targetAge,
        targetGrades: source.targetGrades,
        recommendedLevel: source.recommendedLevel,
        recommendedStudentProfile: source.recommendedStudentProfile,
        status: PartnershipProgramStatus.DRAFT,
        displayOrder: source.displayOrder + 1,
        internalNotes: source.internalNotes,
        schoolValue: source.schoolValue,
        studentValue: source.studentValue,
        finalProjectName: source.finalProjectName,
        finalProjectDescription: source.finalProjectDescription,
        finalProjectExpectedOutput: source.finalProjectExpectedOutput,
        finalProjectSkills: source.finalProjectSkills,
        finalProjectEvaluationMethod: source.finalProjectEvaluationMethod,
        objectives: {
          create: source.objectives.map((item) => ({
            title: item.title,
            description: item.description,
            sortOrder: item.sortOrder,
          })),
        },
        curriculumModules: {
          create: source.curriculumModules.map((item) => ({
            title: item.title,
            description: item.description,
            skillsDeveloped: item.skillsDeveloped,
            sortOrder: item.sortOrder,
          })),
        },
        activities: {
          create: source.activities.map((item) => ({
            name: item.name,
            description: item.description,
            skillsDeveloped: item.skillsDeveloped,
            sortOrder: item.sortOrder,
          })),
        },
        sampleProjects: {
          create: source.sampleProjects.map((item) => ({
            name: item.name,
            description: item.description,
            skills: item.skills,
            expectedOutput: item.expectedOutput,
            sortOrder: item.sortOrder,
          })),
        },
        assessmentMethods: {
          create: source.assessmentMethods.map((item) => ({
            key: item.key,
            label: item.label,
            description: item.description,
            weight: item.weight,
            enabled: item.enabled,
            sortOrder: item.sortOrder,
          })),
        },
        deliveryFormats: {
          create: source.deliveryFormats.map((item) => ({ format: item.format })),
        },
        requirements: {
          create: source.requirements.map((item) => ({
            kind: item.kind,
            priority: item.priority,
            label: item.label,
            description: item.description,
            sortOrder: item.sortOrder,
          })),
        },
        outcomes: {
          create: source.outcomes.map((item) => ({
            title: item.title,
            description: item.description,
            sortOrder: item.sortOrder,
          })),
        },
        documents: {
          create: source.documents.map((item) => ({
            documentType: item.documentType,
            title: item.title,
            url: item.url,
            version: item.version,
            status: item.status,
            notes: item.notes,
            sortOrder: item.sortOrder,
            uploadedAt: item.uploadedAt,
          })),
        },
      },
      include: programInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: row.id,
      action: PartnershipAuditAction.PROGRAM_DUPLICATED,
      performedById: actorId,
      metadata: { sourceProgramId: id } as Prisma.InputJsonValue,
    });
    return this.toResponse(row);
  }

  private buildWhere(query: QueryProgramsDto): Prisma.PartnershipProgramWhereInput {
    const and: Prisma.PartnershipProgramWhereInput[] = [];
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.programType) {
      and.push({ programType: query.programType });
    }
    if (query.recommendedLevel) {
      and.push({ recommendedLevel: query.recommendedLevel });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    const grade = query.targetGrade?.trim();
    if (grade) {
      and.push({ targetGrades: { contains: grade, mode: 'insensitive' } });
    }
    return and.length > 0 ? { AND: and } : {};
  }

  private buildCreateData(dto: CreateProgramDto): Prisma.PartnershipProgramCreateInput {
    return {
      name: dto.name.trim(),
      shortDescription: dto.shortDescription?.trim() ?? '',
      programType: dto.programType,
      targetAge: this.nullableText(dto.targetAge),
      targetGrades: this.nullableText(dto.targetGrades),
      recommendedLevel: dto.recommendedLevel ?? null,
      recommendedStudentProfile: dto.recommendedStudentProfile?.trim() ?? '',
      status: dto.status ?? PartnershipProgramStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      internalNotes: dto.internalNotes?.trim() ?? '',
      schoolValue: dto.schoolValue?.trim() ?? '',
      studentValue: dto.studentValue?.trim() ?? '',
      finalProjectName: this.nullableText(dto.finalProjectName),
      finalProjectDescription: this.nullableText(dto.finalProjectDescription),
      finalProjectExpectedOutput: this.nullableText(dto.finalProjectExpectedOutput),
      finalProjectSkills: this.nullableText(dto.finalProjectSkills),
      finalProjectEvaluationMethod: this.nullableText(dto.finalProjectEvaluationMethod),
      objectives: { create: this.mapObjectives(dto.objectives) },
      curriculumModules: { create: this.mapCurriculumModules(dto.curriculumModules) },
      activities: { create: this.mapActivities(dto.activities) },
      sampleProjects: { create: this.mapSampleProjects(dto.sampleProjects) },
      assessmentMethods: { create: this.mapAssessmentMethods(dto.assessmentMethods) },
      deliveryFormats: { create: this.mapDeliveryFormats(dto.deliveryFormats) },
      requirements: { create: this.mapRequirements(dto.requirements) },
      outcomes: { create: this.mapOutcomes(dto.outcomes) },
      documents: { create: this.mapDocuments(dto.documents) },
    };
  }

  private buildUpdateData(dto: UpdateProgramDto): Prisma.PartnershipProgramUpdateInput {
    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.shortDescription !== undefined
        ? { shortDescription: dto.shortDescription.trim() }
        : {}),
      ...(dto.programType !== undefined ? { programType: dto.programType } : {}),
      ...(dto.targetAge !== undefined ? { targetAge: this.nullableText(dto.targetAge) } : {}),
      ...(dto.targetGrades !== undefined
        ? { targetGrades: this.nullableText(dto.targetGrades) }
        : {}),
      ...(dto.recommendedLevel !== undefined ? { recommendedLevel: dto.recommendedLevel } : {}),
      ...(dto.recommendedStudentProfile !== undefined
        ? { recommendedStudentProfile: dto.recommendedStudentProfile.trim() }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      ...(dto.internalNotes !== undefined ? { internalNotes: dto.internalNotes.trim() } : {}),
      ...(dto.schoolValue !== undefined ? { schoolValue: dto.schoolValue.trim() } : {}),
      ...(dto.studentValue !== undefined ? { studentValue: dto.studentValue.trim() } : {}),
      ...(dto.finalProjectName !== undefined
        ? { finalProjectName: this.nullableText(dto.finalProjectName) }
        : {}),
      ...(dto.finalProjectDescription !== undefined
        ? { finalProjectDescription: this.nullableText(dto.finalProjectDescription) }
        : {}),
      ...(dto.finalProjectExpectedOutput !== undefined
        ? { finalProjectExpectedOutput: this.nullableText(dto.finalProjectExpectedOutput) }
        : {}),
      ...(dto.finalProjectSkills !== undefined
        ? { finalProjectSkills: this.nullableText(dto.finalProjectSkills) }
        : {}),
      ...(dto.finalProjectEvaluationMethod !== undefined
        ? { finalProjectEvaluationMethod: this.nullableText(dto.finalProjectEvaluationMethod) }
        : {}),
      ...(dto.objectives !== undefined ? { objectives: { create: this.mapObjectives(dto.objectives) } } : {}),
      ...(dto.curriculumModules !== undefined
        ? { curriculumModules: { create: this.mapCurriculumModules(dto.curriculumModules) } }
        : {}),
      ...(dto.activities !== undefined ? { activities: { create: this.mapActivities(dto.activities) } } : {}),
      ...(dto.sampleProjects !== undefined
        ? { sampleProjects: { create: this.mapSampleProjects(dto.sampleProjects) } }
        : {}),
      ...(dto.assessmentMethods !== undefined
        ? { assessmentMethods: { create: this.mapAssessmentMethods(dto.assessmentMethods) } }
        : {}),
      ...(dto.deliveryFormats !== undefined
        ? { deliveryFormats: { create: this.mapDeliveryFormats(dto.deliveryFormats) } }
        : {}),
      ...(dto.requirements !== undefined
        ? { requirements: { create: this.mapRequirements(dto.requirements) } }
        : {}),
      ...(dto.outcomes !== undefined ? { outcomes: { create: this.mapOutcomes(dto.outcomes) } } : {}),
      ...(dto.documents !== undefined ? { documents: { create: this.mapDocuments(dto.documents) } } : {}),
    };
  }

  private nullableText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private mapObjectives(
    items: CreateProgramDto['objectives'],
  ): Prisma.PartnershipProgramObjectiveCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapCurriculumModules(
    items: CreateProgramDto['curriculumModules'],
  ): Prisma.PartnershipProgramCurriculumModuleCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim() ?? '',
      skillsDeveloped: item.skillsDeveloped?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapActivities(
    items: CreateProgramDto['activities'],
  ): Prisma.PartnershipProgramActivityCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      name: item.name.trim(),
      description: item.description?.trim() ?? '',
      skillsDeveloped: item.skillsDeveloped?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapSampleProjects(
    items: CreateProgramDto['sampleProjects'],
  ): Prisma.PartnershipProgramSampleProjectCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      name: item.name.trim(),
      description: item.description?.trim() ?? '',
      skills: item.skills?.trim() ?? '',
      expectedOutput: item.expectedOutput?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapAssessmentMethods(
    items: CreateProgramDto['assessmentMethods'],
  ): Prisma.PartnershipProgramAssessmentMethodCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      key: item.key.trim(),
      label: item.label.trim(),
      description: item.description?.trim() ?? '',
      weight: item.weight ?? null,
      enabled: item.enabled ?? true,
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapDeliveryFormats(
    formats: PartnershipDeliveryFormat[] | undefined,
  ): Prisma.PartnershipProgramDeliverySupportCreateWithoutProgramInput[] {
    return (formats ?? []).map((format) => ({ format }));
  }

  private mapRequirements(
    items: CreateProgramDto['requirements'],
  ): Prisma.PartnershipProgramRequirementCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      kind: item.kind,
      priority: item.priority ?? PartnershipProgramRequirementPriority.REQUIRED,
      label: item.label.trim(),
      description: item.description?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapOutcomes(
    items: CreateProgramDto['outcomes'],
  ): Prisma.PartnershipProgramOutcomeCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapDocuments(
    items: CreateProgramDto['documents'],
  ): Prisma.PartnershipProgramDocumentCreateWithoutProgramInput[] {
    return (items ?? []).map((item, index) => ({
      documentType: item.documentType,
      title: item.title.trim(),
      url: item.url?.trim() || null,
      version: item.version?.trim() || '1.0',
      status: item.status ?? PartnershipProgramDocumentStatus.ACTIVE,
      notes: item.notes?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
      ...(item.uploadedAt ? { uploadedAt: new Date(item.uploadedAt) } : {}),
    }));
  }

  private toListItem(row: {
    id: string;
    name: string;
    programType: ProgramWithRelations['programType'];
    targetGrades: string | null;
    recommendedLevel: ProgramWithRelations['recommendedLevel'];
    status: ProgramWithRelations['status'];
    displayOrder: number;
    deliveryFormats: { format: PartnershipDeliveryFormat }[];
  }): ProgramListItemDto {
    return {
      id: row.id,
      name: row.name,
      programType: row.programType,
      targetGrades: row.targetGrades,
      recommendedLevel: row.recommendedLevel,
      deliveryFormats: row.deliveryFormats.map((item) => item.format),
      status: row.status,
      displayOrder: row.displayOrder,
    };
  }

  toResponse(row: ProgramWithRelations): ProgramResponseDto {
    const sortByOrder = <T extends { sortOrder: number }>(items: T[]): T[] =>
      [...items].sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...this.toListItem(row),
      shortDescription: row.shortDescription,
      targetAge: row.targetAge,
      recommendedStudentProfile: row.recommendedStudentProfile,
      internalNotes: row.internalNotes,
      schoolValue: row.schoolValue,
      studentValue: row.studentValue,
      finalProjectName: row.finalProjectName,
      finalProjectDescription: row.finalProjectDescription,
      finalProjectExpectedOutput: row.finalProjectExpectedOutput,
      finalProjectSkills: row.finalProjectSkills,
      finalProjectEvaluationMethod: row.finalProjectEvaluationMethod,
      objectives: sortByOrder(row.objectives).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
      })),
      curriculumModules: sortByOrder(row.curriculumModules).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        skillsDeveloped: item.skillsDeveloped,
        sortOrder: item.sortOrder,
      })),
      activities: sortByOrder(row.activities).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        skillsDeveloped: item.skillsDeveloped,
        sortOrder: item.sortOrder,
      })),
      sampleProjects: sortByOrder(row.sampleProjects).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        skills: item.skills,
        expectedOutput: item.expectedOutput,
        sortOrder: item.sortOrder,
      })),
      assessmentMethods: sortByOrder(row.assessmentMethods).map((item) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        description: item.description,
        weight: item.weight,
        enabled: item.enabled,
        sortOrder: item.sortOrder,
      })),
      requirements: sortByOrder(row.requirements).map((item) => ({
        id: item.id,
        kind: item.kind,
        priority: item.priority,
        label: item.label,
        description: item.description,
        sortOrder: item.sortOrder,
      })),
      outcomes: sortByOrder(row.outcomes).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
      })),
      documents: sortByOrder(row.documents).map((item) => ({
        id: item.id,
        documentType: item.documentType,
        title: item.title,
        url: item.url,
        version: item.version,
        status: item.status,
        notes: item.notes,
        sortOrder: item.sortOrder,
        uploadedAt: item.uploadedAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
