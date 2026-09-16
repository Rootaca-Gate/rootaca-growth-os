import { ApiPropertyOptional } from '@nestjs/swagger';
import { PathCode, StudentLevel, StudentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export const STUDENT_SORT_FIELDS = [
  'fullName',
  'createdAt',
  'status',
  'schoolGrade',
  'availableHoursPerWeek',
  'dateOfBirth',
  'level',
  'path',
] as const;

export type StudentSortField = (typeof STUDENT_SORT_FIELDS)[number];

export class QueryStudentsDto {
  @ApiPropertyOptional({ example: 'yara' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StudentStatus, enumName: 'StudentStatus' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: StudentLevel, enumName: 'StudentLevel' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(StudentLevel)
  level?: StudentLevel;

  @ApiPropertyOptional({ enum: PathCode, enumName: 'PathCode' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PathCode)
  path?: PathCode;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ enum: STUDENT_SORT_FIELDS, default: 'createdAt' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(STUDENT_SORT_FIELDS)
  sortBy: StudentSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
