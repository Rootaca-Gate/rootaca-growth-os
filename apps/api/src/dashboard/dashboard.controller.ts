import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth('JWT')
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Live ROOTACA Growth OS dashboard from current records' })
  @ApiOkResponse({ type: DashboardResponseDto })
  getDashboard(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard();
  }
}
