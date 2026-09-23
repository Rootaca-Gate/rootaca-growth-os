import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CRM_READ_ROLES } from '../common/partnership.roles';
import { PartnershipDashboardDto, PartnershipDashboardService } from './dashboard.service';

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
}
