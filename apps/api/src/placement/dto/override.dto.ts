import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class OverrideLevelDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  levelId!: string;

  @ApiProperty({ example: 'Mentor observed stronger independence than the score shows.' })
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  reason!: string;
}

export class OverridePathDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  pathId!: string;

  @ApiProperty({ example: 'Family constraint: student can only attend the web cohort.' })
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  reason!: string;
}
