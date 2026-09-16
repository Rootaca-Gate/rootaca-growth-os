import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  @Get()
  @ApiOperation({ summary: 'Admin authorization probe' })
  @ApiOkResponse({ schema: { example: { status: 'ok', scope: 'ADMIN' } } })
  probe(): { status: 'ok'; scope: 'ADMIN' } {
    return { status: 'ok', scope: 'ADMIN' };
  }
}
