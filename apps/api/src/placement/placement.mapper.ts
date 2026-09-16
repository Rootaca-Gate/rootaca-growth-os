import {
  LearningPath,
  Level,
  LevelRule,
  PathSkill,
  Prisma,
  Skill,
  StudentPlacement,
  StudentSkill,
  User,
} from '@prisma/client';
import {
  ActorResponseDto,
  LearningPathResponseDto,
  LevelResponseDto,
  LevelRuleResponseDto,
  PathSkillResponseDto,
  PlacementResponseDto,
  SkillResponseDto,
  StudentSkillResponseDto,
} from './dto/placement-response.dto';

export type LevelWithRules = Level & { rules?: LevelRule[] };

export type PathWithSkills = LearningPath & {
  skills?: Array<PathSkill & { skill: Skill }>;
};

export type PlacementRecord = StudentPlacement & {
  systemLevel: LevelWithRules;
  finalLevel: LevelWithRules;
  systemPath: PathWithSkills;
  finalPath: PathWithSkills;
  alternativePath: PathWithSkills;
  levelChangedBy: Pick<User, 'id' | 'displayName'> | null;
  pathChangedBy: Pick<User, 'id' | 'displayName'> | null;
};

export type StudentSkillRecord = StudentSkill & { skill: Skill };

export const placementInclude = {
  systemLevel: { include: { rules: true } },
  finalLevel: { include: { rules: true } },
  systemPath: true,
  finalPath: true,
  alternativePath: true,
  levelChangedBy: { select: { id: true, displayName: true } },
  pathChangedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.StudentPlacementInclude;

export function toLevelRuleResponse(rule: LevelRule): LevelRuleResponseDto {
  return {
    id: rule.id,
    minScore: rule.minScore,
    maxScore: rule.maxScore,
    source: rule.source,
  };
}

export function toLevelResponse(level: LevelWithRules): LevelResponseDto {
  return {
    id: level.id,
    code: level.code,
    name: level.name,
    description: level.description,
    sortOrder: level.sortOrder,
    rules: level.rules?.map(toLevelRuleResponse),
  };
}

export function toSkillResponse(skill: Skill): SkillResponseDto {
  return {
    id: skill.id,
    code: skill.code,
    name: skill.name,
    description: skill.description,
    sortOrder: skill.sortOrder,
  };
}

export function toPathSkillResponse(item: PathSkill & { skill: Skill }): PathSkillResponseDto {
  return {
    skillId: item.skillId,
    skillCode: item.skill.code,
    skillName: item.skill.name,
    weightPercent: item.weightPercent,
  };
}

export function toLearningPathResponse(path: PathWithSkills): LearningPathResponseDto {
  return {
    id: path.id,
    code: path.code,
    name: path.name,
    description: path.description,
    sortOrder: path.sortOrder,
    skills: path.skills
      ?.slice()
      .sort((left, right) => right.weightPercent - left.weightPercent)
      .map(toPathSkillResponse),
  };
}

export function toStudentSkillResponse(item: StudentSkillRecord): StudentSkillResponseDto {
  return {
    skillId: item.skillId,
    code: item.skill.code,
    name: item.skill.name,
    score: item.score,
  };
}

export function toActorResponse(user: Pick<User, 'id' | 'displayName'>): ActorResponseDto {
  return {
    id: user.id,
    displayName: user.displayName,
  };
}

export function toPlacementResponse(placement: PlacementRecord): PlacementResponseDto {
  return {
    id: placement.id,
    studentId: placement.studentId,
    assessmentResultId: placement.assessmentResultId,
    systemLevel: toLevelResponse(placement.systemLevel),
    finalLevel: toLevelResponse(placement.finalLevel),
    systemPath: toLearningPathResponse(placement.systemPath),
    finalPath: toLearningPathResponse(placement.finalPath),
    alternativePath: toLearningPathResponse(placement.alternativePath),
    recommendationReasons: asStringArray(placement.recommendationReasons),
    alternativeReasons: asStringArray(placement.alternativeReasons),
    levelChangedBy: placement.levelChangedBy ? toActorResponse(placement.levelChangedBy) : null,
    pathChangedBy: placement.pathChangedBy ? toActorResponse(placement.pathChangedBy) : null,
    levelOverrideReason: placement.levelOverrideReason,
    pathOverrideReason: placement.pathOverrideReason,
    levelChangedAt: placement.levelChangedAt?.toISOString() ?? null,
    pathChangedAt: placement.pathChangedAt?.toISOString() ?? null,
    createdAt: placement.createdAt.toISOString(),
    updatedAt: placement.updatedAt.toISOString(),
  };
}

export function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function asScoredItems(
  value: Prisma.JsonValue,
): Array<{ code?: string; key?: string; score: number }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const score = typeof record.score === 'number' ? record.score : Number(record.score);
    if (!Number.isFinite(score)) {
      return [];
    }
    return [
      {
        code: typeof record.code === 'string' ? record.code : undefined,
        key: typeof record.key === 'string' ? record.key : undefined,
        score,
      },
    ];
  });
}

export function toJsonArray(value: string[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
