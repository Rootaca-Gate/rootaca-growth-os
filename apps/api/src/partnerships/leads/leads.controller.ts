import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  CreateLeadDto,
  LeadResponseDto,
  PaginatedLeadsDto,
  QueryLeadsDto,
  UpdateLeadDto,
} from './dto/lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('partnerships-leads')
@ApiBearerAuth('JWT')
@Controller('partnerships/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedLeadsDto })
  findAll(@Query() query: QueryLeadsDto): Promise<PaginatedLeadsDto> {
    return this.leadsService.findAll(query);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: LeadResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<LeadResponseDto> {
    return this.leadsService.findOne(id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: LeadResponseDto })
  create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update lead; status changes create activity + audit' })
  @ApiOkResponse({ type: LeadResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.update(id, dto, user.id);
  }
}
