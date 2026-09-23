import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
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
  CreateFollowUpDto,
  FollowUpResponseDto,
  PaginatedFollowUpsDto,
  QueryFollowUpsDto,
  UpdateFollowUpDto,
} from './dto/followup.dto';
import { FollowUpsService } from './followups.service';

@ApiTags('partnerships-followups')
@ApiBearerAuth('JWT')
@Controller('partnerships')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get('followups')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedFollowUpsDto })
  findAll(@Query() query: QueryFollowUpsDto): Promise<PaginatedFollowUpsDto> {
    return this.followUpsService.findAll(query);
  }

  @Get('institutions/:institutionId/followups')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedFollowUpsDto })
  findByInstitution(
    @Param('institutionId', new ParseUUIDPipe()) institutionId: string,
    @Query() query: QueryFollowUpsDto,
  ): Promise<PaginatedFollowUpsDto> {
    return this.followUpsService.findByInstitution(institutionId, query);
  }

  @Post('followups')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: FollowUpResponseDto })
  create(
    @Body() dto: CreateFollowUpDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FollowUpResponseDto> {
    return this.followUpsService.create(dto, user.id);
  }

  @Patch('followups/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: FollowUpResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFollowUpDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FollowUpResponseDto> {
    return this.followUpsService.update(id, dto, user.id);
  }
}
