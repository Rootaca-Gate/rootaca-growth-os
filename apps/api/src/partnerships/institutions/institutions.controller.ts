import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_ADMIN_ROLES, CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/create-institution.dto';
import { InstitutionResponseDto, PaginatedInstitutionsDto } from './dto/institution-response.dto';
import { QueryInstitutionsDto } from './dto/query-institutions.dto';
import { InstitutionsService } from './institutions.service';

@ApiTags('partnerships-institutions')
@ApiBearerAuth('JWT')
@Controller('partnerships/institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'List institutions (excludes soft-deleted by default)' })
  @ApiOkResponse({ type: PaginatedInstitutionsDto })
  findAll(@Query() query: QueryInstitutionsDto): Promise<PaginatedInstitutionsDto> {
    return this.institutionsService.findAll(query);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'Get institution by id' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<InstitutionResponseDto> {
    return this.institutionsService.findOne(id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create institution' })
  @ApiCreatedResponse({ type: InstitutionResponseDto })
  create(
    @Body() dto: CreateInstitutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update institution (PATCH; empty values skipped unless allowClear)' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInstitutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(...CRM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Soft-delete institution' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  softDelete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Roles(...CRM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Restore soft-deleted institution' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.restore(id, user.id);
  }
}
