import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;
}

export class UpdateNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}

export class QueryNotesDto {
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
}

export class NoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  contactId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  leadId!: string | null;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdById!: string;

  @ApiPropertyOptional({ nullable: true })
  createdByName!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedNotesDto {
  @ApiProperty({ type: [NoteResponseDto] })
  items!: NoteResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
