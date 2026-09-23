import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
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
import { ActivitiesService } from './activities.service';
import {
  ActivityResponseDto,
  CreateActivityDto,
  PaginatedActivitiesDto,
  QueryActivitiesDto,
} from './dto/activity.dto';

@ApiTags('partnerships-activities')
@ApiBearerAuth('JWT')
@Controller('partnerships')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('activities')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedActivitiesDto })
  findAll(@Query() query: QueryActivitiesDto): Promise<PaginatedActivitiesDto> {
    return this.activitiesService.findAll(query);
  }

  @Get('institutions/:institutionId/activities')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedActivitiesDto })
  findByInstitution(
    @Param('institutionId', new ParseUUIDPipe()) institutionId: string,
    @Query() query: QueryActivitiesDto,
  ): Promise<PaginatedActivitiesDto> {
    return this.activitiesService.findByInstitution(institutionId, query);
  }

  @Post('activities')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ActivityResponseDto })
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    return this.activitiesService.create(dto, user.id);
  }
}
