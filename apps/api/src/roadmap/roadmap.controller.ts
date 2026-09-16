import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateRoadmapItemDto,
  CreateRoadmapPhaseDto,
  ReorderDto,
  UpdateRoadmapPhaseDto,
  UpsertRoadmapItemDto,
} from './dto/roadmap-write.dto';
import { RoadmapResponseDto, RoadmapTemplateResponseDto } from './dto/roadmap-response.dto';
import { RoadmapService } from './roadmap.service';

const EDITOR_ROLES = [Role.ADMIN, Role.MENTOR] as const;

@ApiBearerAuth('JWT')
@Controller()
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get('roadmap-templates')
  @ApiTags('roadmaps')
  @ApiOperation({ summary: 'List roadmap templates by learning path and level' })
  @ApiOkResponse({ type: [RoadmapTemplateResponseDto] })
  listTemplates(): Promise<RoadmapTemplateResponseDto[]> {
    return this.roadmapService.listTemplates();
  }

  @Get('students/:id/roadmap')
  @ApiTags('students')
  @ApiOperation({
    summary: 'Get the student roadmap, generating it from the path/level template if needed',
  })
  @ApiOkResponse({ type: RoadmapResponseDto })
  getRoadmap(@Param('id', new ParseUUIDPipe()) id: string): Promise<RoadmapResponseDto> {
    return this.roadmapService.getForStudent(id);
  }

  @Post('students/:id/roadmap/generate')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({
    summary: 'Regenerate the student roadmap from the current path and level template',
  })
  @ApiCreatedResponse({ type: RoadmapResponseDto })
  generate(@Param('id', new ParseUUIDPipe()) id: string): Promise<RoadmapResponseDto> {
    return this.roadmapService.generate(id, { replace: true });
  }

  @Post('students/:id/roadmap/phases')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Add a roadmap phase' })
  @ApiCreatedResponse({ type: RoadmapResponseDto })
  addPhase(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateRoadmapPhaseDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.addPhase(id, dto);
  }

  @Put('students/:id/roadmap/phases/reorder')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Reorder roadmap phases' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  reorderPhases(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.reorderPhases(id, dto.ids);
  }

  @Patch('students/:id/roadmap/phases/:phaseId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Edit a roadmap phase' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  updatePhase(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: UpdateRoadmapPhaseDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.updatePhase(id, phaseId, dto);
  }

  @Delete('students/:id/roadmap/phases/:phaseId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Remove a roadmap phase' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  removePhase(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.removePhase(id, phaseId);
  }

  @Post('students/:id/roadmap/phases/:phaseId/items')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Add a roadmap item' })
  @ApiCreatedResponse({ type: RoadmapResponseDto })
  addItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: CreateRoadmapItemDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.addItem(id, phaseId, dto);
  }

  @Put('students/:id/roadmap/phases/:phaseId/items/reorder')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Reorder items inside a phase' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  reorderItems(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: ReorderDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.reorderItems(id, phaseId, dto.ids);
  }

  @Patch('students/:id/roadmap/items/:itemId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Edit a roadmap item, including dates, status, and completion' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpsertRoadmapItemDto,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.updateItem(id, itemId, dto);
  }

  @Delete('students/:id/roadmap/items/:itemId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Remove a roadmap item' })
  @ApiOkResponse({ type: RoadmapResponseDto })
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapService.removeItem(id, itemId);
  }
}
