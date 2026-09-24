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
  ChangeReportStatusDto,
  CreateReportFromDeliveryDto,
  PaginatedReportsDto,
  QueryReportsDto,
  ReportResponseDto,
  UpdateReportDto,
} from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('partnerships-reports')
@ApiBearerAuth('JWT')
@Controller('partnerships/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedReportsDto })
  findAll(@Query() query: QueryReportsDto): Promise<PaginatedReportsDto> {
    return this.reportsService.findAll(query);
  }

  @Post('create-from-delivery')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ReportResponseDto })
  createFromDelivery(
    @Body() dto: CreateReportFromDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.createFromDelivery(dto, user.id);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ReportResponseDto> {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.update(id, dto, user.id);
  }

  @Post(':id/status')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeReportStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.changeStatus(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ReportResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.duplicate(id, user.id);
  }

  @Post(':id/refresh-snapshot')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  refreshSnapshot(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.refreshSnapshot(id, user.id);
  }

  @Post(':id/pdf-generated')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ReportResponseDto })
  markPdfGenerated(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.reportsService.markPdfGenerated(id, user.id);
  }
}
