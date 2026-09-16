import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { OverrideLevelDto, OverridePathDto } from './dto/override.dto';
import {
  LearningPathResponseDto,
  LevelResponseDto,
  PlacementResponseDto,
  SkillResponseDto,
  StudentSkillResponseDto,
} from './dto/placement-response.dto';
import { PlacementService } from './placement.service';

@ApiBearerAuth('JWT')
@Controller()
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Get('levels')
  @ApiTags('levels')
  @ApiOperation({ summary: 'List levels and database-driven score thresholds' })
  @ApiOkResponse({ type: [LevelResponseDto] })
  listLevels(): Promise<LevelResponseDto[]> {
    return this.placementService.listLevels();
  }

  @Get('skills')
  @ApiTags('skills')
  @ApiOperation({ summary: 'List the skill catalog' })
  @ApiOkResponse({ type: [SkillResponseDto] })
  listSkills(): Promise<SkillResponseDto[]> {
    return this.placementService.listSkills();
  }

  @Get('learning-paths')
  @ApiTags('learning-paths')
  @ApiOperation({ summary: 'List learning paths and weighted skills' })
  @ApiOkResponse({ type: [LearningPathResponseDto] })
  listPaths(): Promise<LearningPathResponseDto[]> {
    return this.placementService.listPaths();
  }

  @Get('students/:id/skills')
  @ApiTags('students')
  @ApiOperation({ summary: 'Get the student skill matrix' })
  @ApiOkResponse({ type: [StudentSkillResponseDto] })
  listStudentSkills(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StudentSkillResponseDto[]> {
    return this.placementService.listStudentSkills(id);
  }

  @Get('students/:id/placement')
  @ApiTags('students')
  @ApiOperation({ summary: 'Get the latest level and path recommendation' })
  @ApiOkResponse({ type: PlacementResponseDto })
  getPlacement(@Param('id', new ParseUUIDPipe()) id: string): Promise<PlacementResponseDto> {
    return this.placementService.getStudentPlacement(id);
  }

  @Patch('students/:id/placement/level')
  @ApiTags('students')
  @ApiOperation({
    summary: 'Override the student level. Stores system vs final with an audit trail.',
  })
  @ApiOkResponse({ type: PlacementResponseDto })
  overrideLevel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: OverrideLevelDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PlacementResponseDto> {
    return this.placementService.overrideLevel(id, dto, user.id);
  }

  @Patch('students/:id/placement/path')
  @ApiTags('students')
  @ApiOperation({
    summary: 'Override the learning path. Stores system vs final with an audit trail.',
  })
  @ApiOkResponse({ type: PlacementResponseDto })
  overridePath(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: OverridePathDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PlacementResponseDto> {
    return this.placementService.overridePath(id, dto, user.id);
  }
}
