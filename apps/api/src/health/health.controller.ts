import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Public()
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(['health', '/'])
  @ApiOperation({ summary: 'Service health check' })
  @ApiOkResponse({ type: HealthResponseDto })
  async getHealth(): Promise<HealthResponseDto> {
    let database: 'ok' | 'error' = 'error';
    let hasUsers = false;

    try {
      hasUsers = (await this.prisma.user.count()) > 0;
      database = 'ok';
    } catch {
      database = 'error';
    }

    return {
      status: 'ok',
      service: 'rootaca-api',
      timestamp: new Date().toISOString(),
      database,
      hasUsers,
    };
  }
}
