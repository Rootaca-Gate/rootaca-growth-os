import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapService } from '../roadmap/roadmap.service';
import { OverrideLevelDto, OverridePathDto } from './dto/override.dto';
import {
  LearningPathResponseDto,
  LevelResponseDto,
  PlacementResponseDto,
  SkillResponseDto,
  StudentSkillResponseDto,
} from './dto/placement-response.dto';
import { calculateLevel } from './level-calculator';
import {
  asScoredItems,
  placementInclude,
  PlacementRecord,
  toJsonArray,
  toLearningPathResponse,
  toLevelResponse,
  toPlacementResponse,
  toSkillResponse,
  toStudentSkillResponse,
} from './placement.mapper';
import { recommendPath } from './path-recommender';
import { calculateSkills } from './skill-calculator';

@Injectable()
export class PlacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roadmapService: RoadmapService,
  ) {}

  async listLevels(): Promise<LevelResponseDto[]> {
    const levels = await this.prisma.level.findMany({
      include: { rules: { orderBy: { minScore: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    return levels.map(toLevelResponse);
  }

  async listSkills(): Promise<SkillResponseDto[]> {
    const skills = await this.prisma.skill.findMany({ orderBy: { sortOrder: 'asc' } });
    return skills.map(toSkillResponse);
  }

  async listPaths(): Promise<LearningPathResponseDto[]> {
    const paths = await this.prisma.learningPath.findMany({
      include: { skills: { include: { skill: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return paths.map(toLearningPathResponse);
  }

  async listStudentSkills(studentId: string): Promise<StudentSkillResponseDto[]> {
    await this.ensureStudent(studentId);
    const skills = await this.prisma.studentSkill.findMany({
      where: { studentId },
      include: { skill: true },
      orderBy: { skill: { sortOrder: 'asc' } },
    });

    return skills.map(toStudentSkillResponse);
  }

  async getStudentPlacement(studentId: string): Promise<PlacementResponseDto> {
    await this.ensureStudent(studentId);
    const existing = await this.latestPlacement(studentId);
    if (existing) {
      return toPlacementResponse(existing);
    }

    const session = await this.prisma.orientationSession.findFirst({
      where: { studentId, result: { isNot: null } },
      include: { result: true },
      orderBy: { completedAt: 'desc' },
    });

    if (!session?.result) {
      throw new NotFoundException('Placement is not available until an assessment is completed');
    }

    return this.applyFromAssessmentResult(session.result.id);
  }

  async findByAssessmentResultId(assessmentResultId: string): Promise<PlacementResponseDto | null> {
    const placement = await this.prisma.studentPlacement.findUnique({
      where: { assessmentResultId },
      include: placementInclude,
    });

    return placement ? toPlacementResponse(placement) : null;
  }

  async applyFromCompletedSession(sessionId: string): Promise<PlacementResponseDto | null> {
    const session = await this.prisma.orientationSession.findUnique({
      where: { id: sessionId },
      include: { result: true },
    });

    if (!session?.result) {
      return null;
    }

    return this.applyFromAssessmentResult(session.result.id);
  }

  async applyFromAssessmentResult(assessmentResultId: string): Promise<PlacementResponseDto> {
    const existing = await this.prisma.studentPlacement.findUnique({
      where: { assessmentResultId },
      include: placementInclude,
    });

    if (existing) {
      await this.roadmapService.syncForStudent(existing.studentId);
      return toPlacementResponse(existing);
    }

    const result = await this.prisma.assessmentResult.findUnique({
      where: { id: assessmentResultId },
      include: { session: { include: { student: true } } },
    });

    if (!result) {
      throw new NotFoundException('Assessment result not found');
    }

    const student = result.session.student;
    const [levels, skills, paths] = await Promise.all([
      this.prisma.level.findMany({
        include: { rules: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.skill.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.learningPath.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    if (levels.length === 0 || skills.length === 0 || paths.length === 0) {
      throw new BadRequestException('Placement catalog is not configured');
    }

    const rules = levels.flatMap((level) =>
      level.rules.map((rule) => ({
        code: level.code,
        name: level.name,
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        sortOrder: level.sortOrder,
      })),
    );

    if (rules.length === 0) {
      throw new BadRequestException('Level thresholds are not configured');
    }

    const matched = calculateLevel(result.overallScore, rules);
    const systemLevel = levels.find((level) => level.code === matched.code);
    if (!systemLevel) {
      throw new BadRequestException(`No level found for code ${matched.code}`);
    }

    const categoryScores = asScoredItems(result.categoryScores).flatMap((item) =>
      item.code ? [{ code: item.code, score: item.score }] : [],
    );
    const assessmentSkills = asScoredItems(result.skillScores).flatMap((item) =>
      item.key ? [{ key: item.key, score: item.score }] : [],
    );

    const skillScores = calculateSkills({
      categoryScores,
      assessmentSkills,
      experience: student.programmingExperience,
    });

    const recommendation = recommendPath({
      interests: student.interests,
      learningGoal: student.learningGoal,
      experience: student.programmingExperience,
      currentPath: student.path,
      skills: skillScores,
    });

    const systemPath = paths.find((path) => path.code === recommendation.primary);
    const alternativePath = paths.find((path) => path.code === recommendation.alternative);
    if (!systemPath || !alternativePath) {
      throw new BadRequestException('Recommended learning path is missing from the catalog');
    }

    const skillIdByCode = Object.fromEntries(skills.map((skill) => [skill.code, skill.id]));

    for (const score of skillScores) {
      const skillId = skillIdByCode[score.code];
      if (!skillId) {
        continue;
      }

      await this.prisma.studentSkill.upsert({
        where: {
          studentId_skillId: {
            studentId: student.id,
            skillId,
          },
        },
        update: {
          score: score.score,
          assessmentResultId: result.id,
        },
        create: {
          studentId: student.id,
          skillId,
          score: score.score,
          assessmentResultId: result.id,
        },
      });
    }

    const created = await this.prisma.studentPlacement.create({
      data: {
        studentId: student.id,
        assessmentResultId: result.id,
        systemLevelId: systemLevel.id,
        finalLevelId: systemLevel.id,
        systemPathId: systemPath.id,
        finalPathId: systemPath.id,
        alternativePathId: alternativePath.id,
        recommendationReasons: toJsonArray(recommendation.primaryReasons),
        alternativeReasons: toJsonArray(recommendation.alternativeReasons),
      },
    });

    await this.prisma.student.update({
      where: { id: student.id },
      data: {
        currentLevelId: systemLevel.id,
        currentPathId: systemPath.id,
        path: systemPath.code,
      },
    });

    const placement = await this.requirePlacement(created.id);
    await this.roadmapService.syncForStudent(placement.studentId);
    return toPlacementResponse(placement);
  }

  async overrideLevel(
    studentId: string,
    dto: OverrideLevelDto,
    changedById: string,
  ): Promise<PlacementResponseDto> {
    const placement = await this.requireLatestPlacement(studentId);
    const level = await this.prisma.level.findUnique({ where: { id: dto.levelId } });
    if (!level) {
      throw new NotFoundException('Level not found');
    }

    await this.prisma.studentPlacement.update({
      where: { id: placement.id },
      data: {
        finalLevelId: level.id,
        levelChangedById: changedById,
        levelOverrideReason: dto.reason.trim(),
        levelChangedAt: new Date(),
      },
    });

    await this.prisma.student.update({
      where: { id: studentId },
      data: { currentLevelId: level.id },
    });

    const updated = await this.requirePlacement(placement.id);
    await this.roadmapService.syncForStudent(studentId);
    return toPlacementResponse(updated);
  }

  async overridePath(
    studentId: string,
    dto: OverridePathDto,
    changedById: string,
  ): Promise<PlacementResponseDto> {
    const placement = await this.requireLatestPlacement(studentId);
    const path = await this.prisma.learningPath.findUnique({ where: { id: dto.pathId } });
    if (!path) {
      throw new NotFoundException('Learning path not found');
    }

    await this.prisma.studentPlacement.update({
      where: { id: placement.id },
      data: {
        finalPathId: path.id,
        pathChangedById: changedById,
        pathOverrideReason: dto.reason.trim(),
        pathChangedAt: new Date(),
      },
    });

    await this.prisma.student.update({
      where: { id: studentId },
      data: {
        currentPathId: path.id,
        path: path.code,
      },
    });

    const updated = await this.requirePlacement(placement.id);
    await this.roadmapService.syncForStudent(studentId);
    return toPlacementResponse(updated);
  }

  private async requirePlacement(id: string): Promise<PlacementRecord> {
    const placement = await this.prisma.studentPlacement.findUnique({
      where: { id },
      include: placementInclude,
    });
    if (!placement) {
      throw new NotFoundException('Placement not found');
    }
    return placement;
  }

  private async latestPlacement(studentId: string): Promise<PlacementRecord | null> {
    return this.prisma.studentPlacement.findFirst({
      where: { studentId },
      include: placementInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireLatestPlacement(studentId: string): Promise<PlacementRecord> {
    await this.ensureStudent(studentId);
    const placement = await this.latestPlacement(studentId);
    if (!placement) {
      throw new ConflictException('Complete an assessment before overriding placement');
    }
    return placement;
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
}
