import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateOrientationSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId!: string;
}
