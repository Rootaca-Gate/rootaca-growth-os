import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CRM_READ_ROLES } from '../common/partnership.roles';
import {
  PartnershipDashboardDto,
  PartnershipDashboardService,
  PartnershipSearchResultDto,
} from './dashboard.service';

@ApiTags('partnerships-dashboard')
@ApiBearerAuth('JWT')
@Controller('partnerships/dashboard')
export class PartnershipDashboardController {
  constructor(private readonly dashboardService: PartnershipDashboardService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PartnershipDashboardDto })
  getDashboard(): Promise<PartnershipDashboardDto> {
    return this.dashboardService.getDashboard();
  }

  @Get('search')
  @Roles(...CRM_READ_ROLES)
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiOkResponse({ type: PartnershipSearchResultDto })
  search(@Query('q') q = ''): Promise<PartnershipSearchResultDto> {
    return this.dashboardService.search(q ?? '');
  }
}
