import {
  Body,
  Controller,
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
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  AddTimelineEventDto,
  ChangeOpportunityStatusDto,
  CreateOpportunityDto,
  CreateOpportunityFromDeliveryDto,
  CreateOpportunityFromReportDto,
  CreateProposalFromOpportunityDto,
  OpportunityDashboardDto,
  OpportunityResponseDto,
  OpportunityUserOptionDto,
  PaginatedOpportunitiesDto,
  QueryOpportunitiesDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';
import { RenewalsService } from './renewals.service';

@ApiTags('partnerships-renewals')
@ApiBearerAuth('JWT')
@Controller('partnerships/renewals')
export class RenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedOpportunitiesDto })
  findAll(@Query() query: QueryOpportunitiesDto): Promise<PaginatedOpportunitiesDto> {
    return this.renewalsService.findAll(query);
  }

  @Get('dashboard')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: OpportunityDashboardDto })
  dashboard(): Promise<OpportunityDashboardDto> {
    return this.renewalsService.dashboard();
  }

  @Get('users')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: [OpportunityUserOptionDto] })
  listUsers(): Promise<OpportunityUserOptionDto[]> {
    return this.renewalsService.listUsers();
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  create(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.create(dto, user.id);
  }

  @Post('create-from-delivery')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  createFromDelivery(
    @Body() dto: CreateOpportunityFromDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.createFromDelivery(dto, user.id);
  }

  @Post('create-from-report')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  createFromReport(
    @Body() dto: CreateOpportunityFromReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.createFromReport(dto, user.id);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: OpportunityResponseDto })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: OpportunityResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.update(id, dto, user.id);
  }

  @Post(':id/status')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: OpportunityResponseDto })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeOpportunityStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.changeStatus(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: OpportunityResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.archive(id, user.id);
  }

  @Post(':id/create-proposal')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  createProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateProposalFromOpportunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.createProposal(id, dto, user.id);
  }

  @Post(':id/create-sow')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  createSow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.createSow(id, user.id);
  }

  @Post(':id/timeline')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  addTimelineEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddTimelineEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.renewalsService.addTimelineEvent(id, dto, user.id);
  }
}
