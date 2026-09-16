import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  StudentLevel,
  StudentStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Yara Hassan' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '2012-04-18' })
  @Transform(({ value }) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    return typeof value === 'string' ? value.slice(0, 10) : value;
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: 'Grade 8' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  schoolGrade!: string;

  @ApiProperty({ example: '+201001112233' })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone!: string;

  @ApiProperty({ example: 'Parent: +201009998877' })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  parentContact!: string;

  @ApiProperty({ enum: ProgrammingExperience, enumName: 'ProgrammingExperience' })
  @IsEnum(ProgrammingExperience)
  programmingExperience!: ProgrammingExperience;

  @ApiProperty({ type: [String], example: ['Python', 'Scratch'] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  programmingLanguages!: string[];

  @ApiProperty({ type: [String], example: ['Games', 'Web'] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  interests!: string[];

  @ApiProperty({ example: 'Build games and learn Python fundamentals.' })
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  learningGoal!: string;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  availableHoursPerWeek!: number;

  @ApiProperty({ enum: EnglishLevel, enumName: 'EnglishLevel' })
  @IsEnum(EnglishLevel)
  englishLevel!: EnglishLevel;

  @ApiProperty({ enum: StudentLevel, enumName: 'StudentLevel' })
  @IsEnum(StudentLevel)
  level!: StudentLevel;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  @IsEnum(PathCode)
  path!: PathCode;

  @ApiPropertyOptional({ enum: StudentStatus, enumName: 'StudentStatus' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
