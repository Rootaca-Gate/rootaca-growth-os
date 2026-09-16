import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrientationStage } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AnswerInputDto } from './submit-answers.dto';

export class SaveOrientationSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  notes?: string;

  @ApiPropertyOptional({ enum: OrientationStage, enumName: 'OrientationStage' })
  @IsOptional()
  @IsEnum(OrientationStage)
  currentStage?: OrientationStage;

  @ApiPropertyOptional({ type: [AnswerInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInputDto)
  answers?: AnswerInputDto[];
}
