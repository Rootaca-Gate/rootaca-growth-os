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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_ADMIN_ROLES, CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  ClearResearchResultsDto,
  ClearResearchResultsResultDto,
  CreateResearchCandidateDto,
  CreateResearchJobDto,
  MarkDuplicateDto,
  PaginatedResearchCandidatesDto,
  PaginatedResearchJobsDto,
  QueryResearchCandidatesDto,
  QueryResearchJobsDto,
  ReEnrichContactsResultDto,
  ResearchCandidateDto,
  ResearchDashboardDto,
  ResearchJobDto,
  ResearchProvidersStatusDto,
  UpdateResearchCandidateDto,
} from './dto/research.dto';
import { ResearchService } from './research.service';

@ApiTags('partnerships-research')
@ApiBearerAuth('JWT')
@Controller('partnerships/research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('dashboard')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'Research coverage dashboard (not a completeness claim)' })
  @ApiOkResponse({ type: ResearchDashboardDto })
  dashboard(): Promise<ResearchDashboardDto> {
    return this.researchService.dashboard();
  }

  @Get('providers/status')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({
    summary: 'Discovery provider status (never returns secrets)',
  })
  @ApiOkResponse({ type: ResearchProvidersStatusDto })
  providersStatus(): ResearchProvidersStatusDto {
    return this.researchService.providersStatus();
  }

  @Post('jobs')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create research job with deterministic query plan' })
  @ApiCreatedResponse({ type: ResearchJobDto })
  createJob(
    @Body() dto: CreateResearchJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchJobDto> {
    return this.researchService.createJob(dto, user.id);
  }

  @Get('jobs')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedResearchJobsDto })
  listJobs(@Query() query: QueryResearchJobsDto): Promise<PaginatedResearchJobsDto> {
    return this.researchService.listJobs(query);
  }

  @Get('jobs/:id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ResearchJobDto })
  getJob(@Param('id', new ParseUUIDPipe()) id: string): Promise<ResearchJobDto> {
    return this.researchService.getJob(id);
  }

  @Post('jobs/:id/run')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({
    summary:
      'Run research job: execute WEB_SEARCH when configured, otherwise plan queries only. Never invents results.',
  })
  @ApiOkResponse({ type: ResearchJobDto })
  runJob(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchJobDto> {
    return this.researchService.runJob(id, user.id);
  }

  @Post('jobs/:id/cancel')
  @Roles(...CRM_ADMIN_ROLES)
  @ApiOkResponse({ type: ResearchJobDto })
  cancelJob(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchJobDto> {
    return this.researchService.cancelJob(id, user.id);
  }

  @Post('clear')
  @Roles(...CRM_ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Delete old research scan results (candidates + jobs). Keeps CRM institutions. By default keeps IMPORTED candidates.',
  })
  @ApiOkResponse({ type: ClearResearchResultsResultDto })
  clearResults(
    @Body() dto: ClearResearchResultsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClearResearchResultsResultDto> {
    return this.researchService.clearScanResults(user.id, dto.keepImported !== false);
  }

  @Post('enrich-contacts')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({
    summary:
      'Re-scrape official websites for candidates missing phone/email and backfill CRM institutions when linked',
  })
  @ApiOkResponse({ type: ReEnrichContactsResultDto })
  enrichContacts(@CurrentUser() user: AuthenticatedUser): Promise<ReEnrichContactsResultDto> {
    return this.researchService.reEnrichMissingContacts(user.id);
  }

  @Post('candidates')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create research candidate (manual / public-source entry)' })
  @ApiCreatedResponse({ type: ResearchCandidateDto })
  createCandidate(
    @Body() dto: CreateResearchCandidateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchCandidateDto> {
    return this.researchService.createCandidate(dto, user.id);
  }

  @Get('candidates')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedResearchCandidatesDto })
  listCandidates(
    @Query() query: QueryResearchCandidatesDto,
  ): Promise<PaginatedResearchCandidatesDto> {
    return this.researchService.listCandidates(query);
  }

  @Get('candidates/:id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ResearchCandidateDto })
  getCandidate(@Param('id', new ParseUUIDPipe()) id: string): Promise<ResearchCandidateDto> {
    return this.researchService.getCandidate(id);
  }

  @Patch('candidates/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ResearchCandidateDto })
  updateCandidate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateResearchCandidateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchCandidateDto> {
    return this.researchService.updateCandidate(id, dto, user.id);
  }

  @Post('candidates/:id/verify')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ResearchCandidateDto })
  verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchCandidateDto> {
    return this.researchService.verify(id, user.id);
  }

  @Post('candidates/:id/reject')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ResearchCandidateDto })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchCandidateDto> {
    return this.researchService.reject(id, user.id);
  }

  @Post('candidates/:id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ResearchCandidateDto })
  markDuplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MarkDuplicateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResearchCandidateDto> {
    return this.researchService.markDuplicate(id, dto, user.id);
  }

  @Post('candidates/:id/import')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({
    summary: 'Promote candidate to PartnershipInstitution (re-checks Phase E dedupe)',
  })
  importToCrm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ candidate: ResearchCandidateDto; institutionId: string }> {
    return this.researchService.importToCrm(id, user.id);
  }
}
