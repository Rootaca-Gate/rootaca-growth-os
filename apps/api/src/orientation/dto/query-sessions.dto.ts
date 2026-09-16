import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class QueryOrientationSessionsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
