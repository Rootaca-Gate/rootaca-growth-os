import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return value;
};

export class CreateContactDto {
  @ApiProperty()
  @IsUUID()
  institutionId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDecisionMaker?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublicContact?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDecisionMaker?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublicContact?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowClear?: boolean;
}

export class QueryContactsDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  isDecisionMaker?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasEmail?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasPhone?: boolean;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ enum: ['fullName', 'createdAt', 'updatedAt', 'jobTitle'], default: 'updatedAt' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['fullName', 'createdAt', 'updatedAt', 'jobTitle'])
  sortBy: 'fullName' | 'createdAt' | 'updatedAt' | 'jobTitle' = 'updatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class ContactResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  institutionName!: string | null;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  mobile!: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedin!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  isDecisionMaker!: boolean;

  @ApiProperty()
  isPublicContact!: boolean;

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedContactsDto {
  @ApiProperty({ type: [ContactResponseDto] })
  items!: ContactResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
