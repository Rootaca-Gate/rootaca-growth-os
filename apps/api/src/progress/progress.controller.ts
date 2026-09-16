import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateProgressReviewDto, UpdateProgressReviewDto } from './dto/progress-write.dto';
import { ProgressReviewDto, StudentProgressDashboardDto } from './dto/progress-response.dto';
import { ProgressService } from './progress.service';

const EDITOR_ROLES = [Role.ADMIN, Role.MENTOR] as const;

@ApiBearerAuth('JWT')
@ApiTags('students')
@Controller('students/:id/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Student progress dashboard with history and growth charts' })
  @ApiOkResponse({ type: StudentProgressDashboardDto })
  dashboard(@Param('id', new ParseUUIDPipe()) id: string): Promise<StudentProgressDashboardDto> {
    return this.progressService.getDashboard(id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List student progress reviews, newest first' })
  @ApiOkResponse({ type: [ProgressReviewDto] })
  list(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProgressReviewDto[]> {
    return this.progressService.list(id);
  }

  @Post('reviews')
  @Roles(...EDITOR_ROLES)
  @ApiOperation({ summary: 'Create an initial assessment or monthly review' })
  @ApiCreatedResponse({ type: ProgressReviewDto })
  create(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProgressReviewDto,
  ): Promise<ProgressReviewDto> {
    return this.progressService.create(id, user.id, dto);
  }

  @Get('reviews/:reviewId')
  @ApiOperation({ summary: 'Get one progress review with growth versus the previous review' })
  @ApiOkResponse({ type: ProgressReviewDto })
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
  ): Promise<ProgressReviewDto> {
    return this.progressService.get(id, reviewId);
  }

  @Patch('reviews/:reviewId')
  @Roles(...EDITOR_ROLES)
  @ApiOperation({ summary: 'Update a progress review' })
  @ApiOkResponse({ type: ProgressReviewDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @Body() dto: UpdateProgressReviewDto,
  ): Promise<ProgressReviewDto> {
    return this.progressService.update(id, reviewId, dto);
  }

  @Delete('reviews/:reviewId')
  @Roles(...EDITOR_ROLES)
  @ApiOperation({ summary: 'Delete a progress review' })
  @ApiOkResponse({ type: StudentProgressDashboardDto })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
  ): Promise<StudentProgressDashboardDto> {
    return this.progressService.remove(id, reviewId);
  }
}
