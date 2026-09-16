import { ApiProperty } from '@nestjs/swagger';
import { StudentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStudentStatusDto {
  @ApiProperty({ enum: StudentStatus, enumName: 'StudentStatus' })
  @IsEnum(StudentStatus)
  status!: StudentStatus;
}
