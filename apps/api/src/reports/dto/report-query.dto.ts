import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

export const REPORT_LOCALES = ['en', 'ar'] as const;

export type ReportLocale = (typeof REPORT_LOCALES)[number];

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: REPORT_LOCALES, default: 'en' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(REPORT_LOCALES)
  locale: ReportLocale = 'en';
}
