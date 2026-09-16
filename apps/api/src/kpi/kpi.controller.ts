import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateKpiDto, RecordStudentKpiDto, UpdateKpiDto } from './dto/kpi-write.dto';
import { KpiDefinitionDto, StudentKpiDashboardDto } from './dto/kpi-response.dto';
import { KpiService } from './kpi.service';

const EDITOR_ROLES = [Role.ADMIN, Role.MENTOR] as const;

@ApiBearerAuth('JWT')
@Controller()
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('kpis')
  @ApiTags('kpis')
  @ApiOperation({ summary: 'List KPI definitions' })
  @ApiOkResponse({ type: [KpiDefinitionDto] })
  list(): Promise<KpiDefinitionDto[]> {
    return this.kpiService.listDefinitions();
  }

  @Post('kpis')
  @Roles(Role.ADMIN)
  @ApiTags('kpis')
  @ApiOperation({ summary: 'Create a KPI definition' })
  @ApiCreatedResponse({ type: KpiDefinitionDto })
  create(@Body() dto: CreateKpiDto): Promise<KpiDefinitionDto> {
    return this.kpiService.createDefinition(dto);
  }

  @Patch('kpis/:id')
  @Roles(Role.ADMIN)
  @ApiTags('kpis')
  @ApiOperation({ summary: 'Update a KPI definition' })
  @ApiOkResponse({ type: KpiDefinitionDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateKpiDto,
  ): Promise<KpiDefinitionDto> {
    return this.kpiService.updateDefinition(id, dto);
  }

  @Delete('kpis/:id')
  @Roles(Role.ADMIN)
  @ApiTags('kpis')
  @ApiOperation({ summary: 'Deactivate a KPI definition' })
  @ApiOkResponse({ type: KpiDefinitionDto })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiDefinitionDto> {
    return this.kpiService.deactivateDefinition(id);
  }

  @Get('students/:id/kpis')
  @ApiTags('students')
  @ApiOperation({
    summary: 'Get the student KPI dashboard, creating current weekly and monthly records',
  })
  @ApiOkResponse({ type: StudentKpiDashboardDto })
  dashboard(@Param('id', new ParseUUIDPipe()) id: string): Promise<StudentKpiDashboardDto> {
    return this.kpiService.getStudentDashboard(id);
  }

  @Patch('students/:id/kpis/:studentKpiId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Record actual, target, or notes for the current KPI period' })
  @ApiOkResponse({ type: StudentKpiDashboardDto })
  record(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentKpiId', new ParseUUIDPipe()) studentKpiId: string,
    @Body() dto: RecordStudentKpiDto,
  ): Promise<StudentKpiDashboardDto> {
    return this.kpiService.recordActual(id, studentKpiId, dto);
  }
}
