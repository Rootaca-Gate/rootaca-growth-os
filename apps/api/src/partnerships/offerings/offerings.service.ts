import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipOfferingStatus,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  CreateOfferingDto,
  OfferingBaseFields,
  OfferingListItemDto,
  OfferingRequirementDto,
  OfferingResponseDto,
  PaginatedOfferingsDto,
  QueryOfferingsDto,
  UpdateOfferingDto,
} from './dto/offering.dto';

/**
 * The linked program is loaded together with every offering read so inherited
 * fields always reflect the *latest* program content (live link). We pull the
 * program relations needed to resolve inheritance in {@link OfferingsService.toResponse}.
 */
const programInclude = {
  objectives: { orderBy: { sortOrder: 'asc' as const } },
  curriculumModules: { orderBy: { sortOrder: 'asc' as const } },
  activities: { orderBy: { sortOrder: 'asc' as const } },
  sampleProjects: { orderBy: { sortOrder: 'asc' as const } },
  assessmentMethods: { orderBy: { sortOrder: 'asc' as const } },
  requirements: { orderBy: { sortOrder: 'asc' as const } },
  outcomes: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.PartnershipProgramInclude;

const offeringInclude = {
  program: { include: programInclude },
  selectedModules: { orderBy: { sortOrder: 'asc' as const } },
  selectedProjects: { orderBy: { sortOrder: 'asc' as const } },
  requirements: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.PartnershipOfferingInclude;

type OfferingWithRelations = Prisma.PartnershipOfferingGetPayload<{ include: typeof offeringInclude }>;

/**
 * Plain scalar payload assignable to both create and update inputs. Nullable
 * override/logistics fields carry `null` to intentionally clear a value (so the
 * program value is inherited at read time).
 */
type OfferingScalarData = {
  targetAge?: string | null;
  targetGrades?: string | null;
  recommendedLevel?: PartnershipProgramLevel | null;
  learnerProfile?: string | null;
  duration?: number | null;
  durationUnit?: PartnershipDurationUnit | null;
  numberOfSessions?: number | null;
  sessionDurationMinutes?: number | null;
  sessionFrequency?: string | null;
  deliveryMode?: PartnershipDeliveryMode | null;
  locationNotes?: string;
  groupSizeMin?: number | null;
  groupSizeMax?: number | null;
  numberOfGroups?: number | null;
  instructorRequirement?: string;
  coordinatorRequirement?: string;
  curriculumCustomizationNotes?: string;
  projectCustomizationNotes?: string;
  includeFinalProject?: boolean;
  assessmentFrequency?: string;
  includeInitialAssessment?: boolean;
  includeMidAssessment?: boolean;
  includeFinalAssessment?: boolean;
  studentProgressReport?: boolean;
  schoolSummaryReport?: boolean;
  internalNotes?: string;
  commercialNotes?: string;
  displayOrder?: number;
};

/** Normalized requirement row shared by inherited (program) and custom rows. */
type NormalizedRequirement = {
  id: string;
  kind: PartnershipProgramRequirementKind;
  priority: 'REQUIRED' | 'RECOMMENDED';
  label: string;
  description: string;
  sortOrder: number;
};

@Injectable()
export class OfferingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async create(dto: CreateOfferingDto, actorId: string): Promise<OfferingResponseDto> {
    await this.assertProgramExists(dto.programId);
    await this.assertSelectionsBelongToProgram(
      dto.programId,
      dto.selectedModuleIds,
      dto.selectedProjectIds,
    );

    const row = await this.prisma.partnershipOffering.create({
      data: {
        name: dto.name.trim(),
        program: { connect: { id: dto.programId } },
        deliveryFormat: dto.deliveryFormat,
        status: dto.status ?? PartnershipOfferingStatus.DRAFT,
        ...this.buildScalarData(dto),
        selectedModules: { create: this.mapModuleSelections(dto.selectedModuleIds) },
        selectedProjects: { create: this.mapProjectSelections(dto.selectedProjectIds) },
        requirements: { create: this.mapRequirements(dto.requirements) },
      },
      include: offeringInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: row.id,
      action: PartnershipAuditAction.OFFERING_CREATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async findAll(query: QueryOfferingsDto): Promise<PaginatedOfferingsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipOffering.count({ where }),
      this.prisma.partnershipOffering.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          program: {
            select: {
              name: true,
              targetGrades: true,
              recommendedLevel: true,
            },
          },
        },
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

  async findOne(id: string): Promise<OfferingResponseDto> {
    const row = await this.prisma.partnershipOffering.findUnique({
      where: { id },
      include: offeringInclude,
    });
    if (!row) {
      throw new NotFoundException('Offering not found');
    }
    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateOfferingDto, actorId: string): Promise<OfferingResponseDto> {
    const existing = await this.prisma.partnershipOffering.findUnique({
      where: { id },
      select: { id: true, programId: true },
    });
    if (!existing) {
      throw new NotFoundException('Offering not found');
    }

    // Offerings never re-point to another program; validate selections against
    // the offering's own (live-linked) program.
    await this.assertSelectionsBelongToProgram(
      existing.programId,
      dto.selectedModuleIds,
      dto.selectedProjectIds,
    );

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.selectedModuleIds !== undefined) {
        await tx.partnershipOfferingSelectedModule.deleteMany({ where: { offeringId: id } });
      }
      if (dto.selectedProjectIds !== undefined) {
        await tx.partnershipOfferingSelectedProject.deleteMany({ where: { offeringId: id } });
      }
      if (dto.requirements !== undefined) {
        await tx.partnershipOfferingRequirement.deleteMany({ where: { offeringId: id } });
      }

      return tx.partnershipOffering.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.deliveryFormat !== undefined ? { deliveryFormat: dto.deliveryFormat } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...this.buildScalarData(dto),
          ...(dto.selectedModuleIds !== undefined
            ? { selectedModules: { create: this.mapModuleSelections(dto.selectedModuleIds) } }
            : {}),
          ...(dto.selectedProjectIds !== undefined
            ? { selectedProjects: { create: this.mapProjectSelections(dto.selectedProjectIds) } }
            : {}),
          ...(dto.requirements !== undefined
            ? { requirements: { create: this.mapRequirements(dto.requirements) } }
            : {}),
        },
        include: offeringInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: id,
      action: PartnershipAuditAction.OFFERING_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async archive(id: string, actorId: string): Promise<OfferingResponseDto> {
    const existing = await this.prisma.partnershipOffering.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Offering not found');
    }

    const row = await this.prisma.partnershipOffering.update({
      where: { id },
      data: { status: PartnershipOfferingStatus.ARCHIVED },
      include: offeringInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: id,
      action: PartnershipAuditAction.OFFERING_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async duplicate(id: string, actorId: string): Promise<OfferingResponseDto> {
    const source = await this.prisma.partnershipOffering.findUnique({
      where: { id },
      include: offeringInclude,
    });
    if (!source) {
      throw new NotFoundException('Offering not found');
    }

    const row = await this.prisma.partnershipOffering.create({
      data: {
        name: `${source.name} (Copy)`,
        program: { connect: { id: source.programId } },
        deliveryFormat: source.deliveryFormat,
        status: PartnershipOfferingStatus.DRAFT,
        displayOrder: source.displayOrder + 1,
        targetAge: source.targetAge,
        targetGrades: source.targetGrades,
        recommendedLevel: source.recommendedLevel,
        learnerProfile: source.learnerProfile,
        duration: source.duration,
        durationUnit: source.durationUnit,
        numberOfSessions: source.numberOfSessions,
        sessionDurationMinutes: source.sessionDurationMinutes,
        sessionFrequency: source.sessionFrequency,
        deliveryMode: source.deliveryMode,
        locationNotes: source.locationNotes,
        groupSizeMin: source.groupSizeMin,
        groupSizeMax: source.groupSizeMax,
        numberOfGroups: source.numberOfGroups,
        instructorRequirement: source.instructorRequirement,
        coordinatorRequirement: source.coordinatorRequirement,
        curriculumCustomizationNotes: source.curriculumCustomizationNotes,
        projectCustomizationNotes: source.projectCustomizationNotes,
        includeFinalProject: source.includeFinalProject,
        assessmentFrequency: source.assessmentFrequency,
        includeInitialAssessment: source.includeInitialAssessment,
        includeMidAssessment: source.includeMidAssessment,
        includeFinalAssessment: source.includeFinalAssessment,
        studentProgressReport: source.studentProgressReport,
        schoolSummaryReport: source.schoolSummaryReport,
        internalNotes: source.internalNotes,
        commercialNotes: source.commercialNotes,
        selectedModules: {
          create: source.selectedModules.map((item) => ({
            moduleId: item.moduleId,
            sortOrder: item.sortOrder,
          })),
        },
        selectedProjects: {
          create: source.selectedProjects.map((item) => ({
            sampleProjectId: item.sampleProjectId,
            sortOrder: item.sortOrder,
          })),
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
      },
      include: offeringInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: row.id,
      action: PartnershipAuditAction.OFFERING_DUPLICATED,
      performedById: actorId,
      metadata: { sourceOfferingId: id } as Prisma.InputJsonValue,
    });
    return this.toResponse(row);
  }

  // --- Validation helpers ----------------------------------------------------

  private async assertProgramExists(programId: string): Promise<void> {
    const program = await this.prisma.partnershipProgram.findUnique({
      where: { id: programId },
      select: { id: true },
    });
    if (!program) {
      throw new BadRequestException('Linked program not found');
    }
  }

  private async assertSelectionsBelongToProgram(
    programId: string,
    moduleIds: string[] | undefined,
    projectIds: string[] | undefined,
  ): Promise<void> {
    if (moduleIds && moduleIds.length > 0) {
      const count = await this.prisma.partnershipProgramCurriculumModule.count({
        where: { programId, id: { in: moduleIds } },
      });
      if (count !== new Set(moduleIds).size) {
        throw new BadRequestException('One or more selected modules do not belong to the program');
      }
    }
    if (projectIds && projectIds.length > 0) {
      const count = await this.prisma.partnershipProgramSampleProject.count({
        where: { programId, id: { in: projectIds } },
      });
      if (count !== new Set(projectIds).size) {
        throw new BadRequestException('One or more selected projects do not belong to the program');
      }
    }
  }

  // --- Data mapping ----------------------------------------------------------

  private buildWhere(query: QueryOfferingsDto): Prisma.PartnershipOfferingWhereInput {
    const and: Prisma.PartnershipOfferingWhereInput[] = [];
    const search = query.search?.trim();
    if (search) {
      and.push({ name: { contains: search, mode: 'insensitive' } });
    }
    if (query.programId) {
      and.push({ programId: query.programId });
    }
    if (query.deliveryFormat) {
      and.push({ deliveryFormat: query.deliveryFormat });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    // Resolved level: offering override OR (null override + matching program level).
    if (query.recommendedLevel) {
      and.push({
        OR: [
          { recommendedLevel: query.recommendedLevel },
          {
            AND: [
              { recommendedLevel: null },
              { program: { recommendedLevel: query.recommendedLevel } },
            ],
          },
        ],
      });
    }
    // Resolved grades: substring on override, or on program when override is null.
    const grades = query.targetGrades?.trim();
    if (grades) {
      and.push({
        OR: [
          { targetGrades: { contains: grades, mode: 'insensitive' } },
          {
            AND: [
              { targetGrades: null },
              { program: { targetGrades: { contains: grades, mode: 'insensitive' } } },
            ],
          },
        ],
      });
    }
    return and.length > 0 ? { AND: and } : {};
  }

  /**
   * Scalar (non-relation) fields shared by create/update. Only keys present on
   * the DTO are emitted, so an update PATCH never clobbers untouched fields.
   * Nullable override/logistics fields are normalized: empty strings become
   * null so inheritance kicks in at read time.
   */
  private buildScalarData(dto: OfferingBaseFields): OfferingScalarData {
    const data: OfferingScalarData = {};
    if (dto.targetAge !== undefined) data.targetAge = this.nullableText(dto.targetAge);
    if (dto.targetGrades !== undefined) data.targetGrades = this.nullableText(dto.targetGrades);
    if (dto.recommendedLevel !== undefined) data.recommendedLevel = dto.recommendedLevel ?? null;
    if (dto.learnerProfile !== undefined) data.learnerProfile = this.nullableText(dto.learnerProfile);
    if (dto.duration !== undefined) data.duration = dto.duration ?? null;
    if (dto.durationUnit !== undefined) data.durationUnit = dto.durationUnit ?? null;
    if (dto.numberOfSessions !== undefined) data.numberOfSessions = dto.numberOfSessions ?? null;
    if (dto.sessionDurationMinutes !== undefined)
      data.sessionDurationMinutes = dto.sessionDurationMinutes ?? null;
    if (dto.sessionFrequency !== undefined)
      data.sessionFrequency = this.nullableText(dto.sessionFrequency);
    if (dto.deliveryMode !== undefined) data.deliveryMode = dto.deliveryMode ?? null;
    if (dto.locationNotes !== undefined) data.locationNotes = dto.locationNotes.trim();
    if (dto.groupSizeMin !== undefined) data.groupSizeMin = dto.groupSizeMin ?? null;
    if (dto.groupSizeMax !== undefined) data.groupSizeMax = dto.groupSizeMax ?? null;
    if (dto.numberOfGroups !== undefined) data.numberOfGroups = dto.numberOfGroups ?? null;
    if (dto.instructorRequirement !== undefined)
      data.instructorRequirement = dto.instructorRequirement.trim();
    if (dto.coordinatorRequirement !== undefined)
      data.coordinatorRequirement = dto.coordinatorRequirement.trim();
    if (dto.curriculumCustomizationNotes !== undefined)
      data.curriculumCustomizationNotes = dto.curriculumCustomizationNotes.trim();
    if (dto.projectCustomizationNotes !== undefined)
      data.projectCustomizationNotes = dto.projectCustomizationNotes.trim();
    if (dto.includeFinalProject !== undefined) data.includeFinalProject = dto.includeFinalProject;
    if (dto.assessmentFrequency !== undefined)
      data.assessmentFrequency = dto.assessmentFrequency.trim();
    if (dto.includeInitialAssessment !== undefined)
      data.includeInitialAssessment = dto.includeInitialAssessment;
    if (dto.includeMidAssessment !== undefined)
      data.includeMidAssessment = dto.includeMidAssessment;
    if (dto.includeFinalAssessment !== undefined)
      data.includeFinalAssessment = dto.includeFinalAssessment;
    if (dto.studentProgressReport !== undefined)
      data.studentProgressReport = dto.studentProgressReport;
    if (dto.schoolSummaryReport !== undefined) data.schoolSummaryReport = dto.schoolSummaryReport;
    if (dto.internalNotes !== undefined) data.internalNotes = dto.internalNotes.trim();
    if (dto.commercialNotes !== undefined) data.commercialNotes = dto.commercialNotes.trim();
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    return data;
  }

  private nullableText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private mapModuleSelections(
    moduleIds: string[] | undefined,
  ): Prisma.PartnershipOfferingSelectedModuleUncheckedCreateWithoutOfferingInput[] {
    return (moduleIds ?? []).map((moduleId, index) => ({ moduleId, sortOrder: index }));
  }

  private mapProjectSelections(
    projectIds: string[] | undefined,
  ): Prisma.PartnershipOfferingSelectedProjectUncheckedCreateWithoutOfferingInput[] {
    return (projectIds ?? []).map((sampleProjectId, index) => ({
      sampleProjectId,
      sortOrder: index,
    }));
  }

  private mapRequirements(
    items: OfferingRequirementDto[] | undefined,
  ): Prisma.PartnershipOfferingRequirementCreateWithoutOfferingInput[] {
    return (items ?? []).map((item, index) => ({
      kind: item.kind,
      priority: item.priority ?? PartnershipProgramRequirementPriority.REQUIRED,
      label: item.label.trim(),
      description: item.description?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  // --- Response shaping ------------------------------------------------------

  private toListItem(row: {
    id: string;
    name: string;
    programId: string;
    deliveryFormat: OfferingWithRelations['deliveryFormat'];
    status: OfferingWithRelations['status'];
    targetGrades: string | null;
    recommendedLevel: PartnershipProgramLevel | null;
    duration: number | null;
    durationUnit: PartnershipDurationUnit | null;
    numberOfSessions: number | null;
    sessionDurationMinutes: number | null;
    displayOrder: number;
    updatedAt: Date;
    program: {
      name: string;
      targetGrades?: string | null;
      recommendedLevel?: PartnershipProgramLevel | null;
    };
  }): OfferingListItemDto {
    return {
      id: row.id,
      name: row.name,
      programId: row.programId,
      programName: row.program.name,
      deliveryFormat: row.deliveryFormat,
      status: row.status,
      targetGrades: row.targetGrades ?? row.program.targetGrades ?? null,
      recommendedLevel: row.recommendedLevel ?? row.program.recommendedLevel ?? null,
      duration: row.duration,
      durationUnit: row.durationUnit,
      numberOfSessions: row.numberOfSessions,
      sessionDurationMinutes: row.sessionDurationMinutes,
      displayOrder: row.displayOrder,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Builds the full response including read-time inheritance resolution:
   *   - override fields fall back to the linked program when null;
   *   - curriculum/projects are filtered by selections (empty => inherit ALL);
   *   - requirements are custom-if-any, else inherited from the program;
   *   - the final project block is surfaced only when includeFinalProject.
   */
  toResponse(row: OfferingWithRelations): OfferingResponseDto {
    const program = row.program;
    const sortByOrder = <T extends { sortOrder: number }>(items: T[]): T[] =>
      [...items].sort((a, b) => a.sortOrder - b.sortOrder);

    const selectedModuleIds = sortByOrder(row.selectedModules).map((item) => item.moduleId);
    const selectedProjectIds = sortByOrder(row.selectedProjects).map((item) => item.sampleProjectId);
    const inheritAllModules = selectedModuleIds.length === 0;
    const inheritAllProjects = selectedProjectIds.length === 0;

    // Filter + order program content by selection (falling back to ALL).
    const resolvedModules = inheritAllModules
      ? sortByOrder(program.curriculumModules)
      : this.orderBySelection(program.curriculumModules, selectedModuleIds);
    const resolvedProjects = inheritAllProjects
      ? sortByOrder(program.sampleProjects)
      : this.orderBySelection(program.sampleProjects, selectedProjectIds);

    const requirementsInherited = row.requirements.length === 0;
    // Normalize to a common shape so the inherited (program) and custom
    // (offering) requirement rows can share the same downstream mapping.
    const normalizeRequirement = (item: {
      id: string;
      kind: PartnershipProgramRequirementKind;
      priority: 'REQUIRED' | 'RECOMMENDED';
      label: string;
      description: string;
      sortOrder: number;
    }): NormalizedRequirement => ({
      id: item.id,
      kind: item.kind,
      priority: item.priority,
      label: item.label,
      description: item.description,
      sortOrder: item.sortOrder,
    });
    const resolvedRequirements: NormalizedRequirement[] = requirementsInherited
      ? program.requirements.map(normalizeRequirement)
      : row.requirements.map(normalizeRequirement);

    const includeFinalProject = row.includeFinalProject;

    return {
      // list item fields
      ...this.toListItem(row),

      // raw override fields
      targetAge: row.targetAge,
      targetGrades: row.targetGrades,
      recommendedLevel: row.recommendedLevel,
      learnerProfile: row.learnerProfile,

      // raw delivery / logistics
      duration: row.duration,
      durationUnit: row.durationUnit,
      numberOfSessions: row.numberOfSessions,
      sessionDurationMinutes: row.sessionDurationMinutes,
      sessionFrequency: row.sessionFrequency,
      deliveryMode: row.deliveryMode,
      locationNotes: row.locationNotes,
      groupSizeMin: row.groupSizeMin,
      groupSizeMax: row.groupSizeMax,
      numberOfGroups: row.numberOfGroups,
      instructorRequirement: row.instructorRequirement,
      coordinatorRequirement: row.coordinatorRequirement,

      // raw customization / assessment / reporting
      curriculumCustomizationNotes: row.curriculumCustomizationNotes,
      projectCustomizationNotes: row.projectCustomizationNotes,
      includeFinalProject,
      assessmentFrequency: row.assessmentFrequency,
      includeInitialAssessment: row.includeInitialAssessment,
      includeMidAssessment: row.includeMidAssessment,
      includeFinalAssessment: row.includeFinalAssessment,
      studentProgressReport: row.studentProgressReport,
      schoolSummaryReport: row.schoolSummaryReport,
      internalNotes: row.internalNotes,
      commercialNotes: row.commercialNotes,
      createdAt: row.createdAt.toISOString(),

      program: {
        id: program.id,
        name: program.name,
        programType: program.programType,
        shortDescription: program.shortDescription,
        status: program.status,
        targetAge: program.targetAge,
        targetGrades: program.targetGrades,
        recommendedLevel: program.recommendedLevel,
      },

      resolved: {
        targetAge: row.targetAge ?? program.targetAge,
        targetGrades: row.targetGrades ?? program.targetGrades,
        recommendedLevel: row.recommendedLevel ?? program.recommendedLevel,
        learnerProfile: row.learnerProfile ?? (program.recommendedStudentProfile || null),
        shortDescription: program.shortDescription,
        schoolValue: program.schoolValue,
        studentValue: program.studentValue,
        objectives: sortByOrder(program.objectives).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          sortOrder: item.sortOrder,
        })),
        curriculumModules: resolvedModules.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          skillsDeveloped: item.skillsDeveloped,
          sortOrder: item.sortOrder,
        })),
        activities: sortByOrder(program.activities).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          skillsDeveloped: item.skillsDeveloped,
          sortOrder: item.sortOrder,
        })),
        sampleProjects: resolvedProjects.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          skills: item.skills,
          expectedOutput: item.expectedOutput,
          sortOrder: item.sortOrder,
        })),
        includeFinalProject,
        finalProjectName: includeFinalProject ? program.finalProjectName : null,
        finalProjectDescription: includeFinalProject ? program.finalProjectDescription : null,
        finalProjectExpectedOutput: includeFinalProject
          ? program.finalProjectExpectedOutput
          : null,
        finalProjectSkills: includeFinalProject ? program.finalProjectSkills : null,
        finalProjectEvaluationMethod: includeFinalProject
          ? program.finalProjectEvaluationMethod
          : null,
        assessmentMethods: sortByOrder(program.assessmentMethods).map((item) => ({
          id: item.id,
          key: item.key,
          label: item.label,
          description: item.description,
          weight: item.weight,
          enabled: item.enabled,
          sortOrder: item.sortOrder,
        })),
        requirements: sortByOrder(resolvedRequirements).map((item) => ({
          id: item.id,
          kind: item.kind,
          priority: item.priority,
          label: item.label,
          description: item.description,
          sortOrder: item.sortOrder,
        })),
        requirementsInherited,
        outcomes: sortByOrder(program.outcomes).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          sortOrder: item.sortOrder,
        })),
      },

      selection: {
        selectedModuleIds,
        selectedProjectIds,
        inheritAllModules,
        inheritAllProjects,
      },
    };
  }

  /** Orders program rows to match the offering selection order, dropping ids
   * that no longer resolve (e.g. a module removed from the program). */
  private orderBySelection<T extends { id: string }>(rows: T[], orderedIds: string[]): T[] {
    const byId = new Map(rows.map((row) => [row.id, row]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((row): row is T => row !== undefined);
  }
}
