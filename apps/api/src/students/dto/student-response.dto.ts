import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  StudentLevel,
  StudentStatus,
} from '@prisma/client';
import {
  LearningPathResponseDto,
  LevelResponseDto,
} from '../../placement/dto/placement-response.dto';

export class StudentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ example: '2012-04-18' })
  dateOfBirth!: string;

  @ApiProperty()
  schoolGrade!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  parentContact!: string;

  @ApiProperty({ enum: ProgrammingExperience, enumName: 'ProgrammingExperience' })
  programmingExperience!: ProgrammingExperience;

  @ApiProperty({ type: [String] })
  programmingLanguages!: string[];

  @ApiProperty({ type: [String] })
  interests!: string[];

  @ApiProperty()
  learningGoal!: string;

  @ApiProperty()
  availableHoursPerWeek!: number;

  @ApiProperty({ enum: EnglishLevel, enumName: 'EnglishLevel' })
  englishLevel!: EnglishLevel;

  @ApiProperty({ enum: StudentStatus, enumName: 'StudentStatus' })
  status!: StudentStatus;

  @ApiProperty({ enum: StudentLevel, enumName: 'StudentLevel' })
  level!: StudentLevel;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  path!: PathCode;

  @ApiPropertyOptional({ type: LevelResponseDto })
  currentLevel?: LevelResponseDto | null;

  @ApiPropertyOptional({ type: LearningPathResponseDto })
  currentPath?: LearningPathResponseDto | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
