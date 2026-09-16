import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
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
  AssignProjectDto,
  CreateProjectDto,
  UpdateMilestoneDto,
  UpdateProjectDto,
  UpdateStudentProjectDto,
} from './dto/project-write.dto';
import {
  ProjectDefinitionDto,
  ProjectDetailsDto,
  StudentProjectDto,
  StudentProjectSummaryDto,
} from './dto/project-response.dto';
import { ProjectService } from './project.service';

const EDITOR_ROLES = [Role.ADMIN, Role.MENTOR] as const;

@ApiBearerAuth('JWT')
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('projects')
  @ApiTags('projects')
  @ApiOperation({ summary: 'List educational project catalog' })
  @ApiOkResponse({ type: [ProjectDefinitionDto] })
  list(): Promise<ProjectDefinitionDto[]> {
    return this.projectService.listProjects();
  }

  @Post('projects')
  @Roles(Role.ADMIN)
  @ApiTags('projects')
  @ApiOperation({ summary: 'Create an educational project definition' })
  @ApiCreatedResponse({ type: ProjectDefinitionDto })
  create(@Body() dto: CreateProjectDto): Promise<ProjectDefinitionDto> {
    return this.projectService.createProject(dto);
  }

  @Get('projects/:id')
  @ApiTags('projects')
  @ApiOperation({ summary: 'Get an educational project and its student assignments' })
  @ApiOkResponse({ type: ProjectDetailsDto })
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProjectDetailsDto> {
    return this.projectService.getProject(id);
  }

  @Patch('projects/:id')
  @Roles(Role.ADMIN)
  @ApiTags('projects')
  @ApiOperation({ summary: 'Update an educational project definition' })
  @ApiOkResponse({ type: ProjectDefinitionDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDefinitionDto> {
    return this.projectService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @Roles(Role.ADMIN)
  @ApiTags('projects')
  @ApiOperation({ summary: 'Deactivate an educational project' })
  @ApiOkResponse({ type: ProjectDefinitionDto })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProjectDefinitionDto> {
    return this.projectService.deactivateProject(id);
  }

  @Post('projects/:id/assign')
  @Roles(...EDITOR_ROLES)
  @ApiTags('projects')
  @ApiOperation({ summary: 'Assign an educational project to a student with eight milestones' })
  @ApiCreatedResponse({ type: StudentProjectDto })
  assign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignProjectDto,
  ): Promise<StudentProjectDto> {
    return this.projectService.assign(id, dto);
  }

  @Get('students/:id/projects')
  @ApiTags('students')
  @ApiOperation({ summary: 'List assigned educational projects and overall progress' })
  @ApiOkResponse({ type: StudentProjectSummaryDto })
  listForStudent(@Param('id', new ParseUUIDPipe()) id: string): Promise<StudentProjectSummaryDto> {
    return this.projectService.listStudentProjects(id);
  }

  @Get('students/:id/projects/:studentProjectId')
  @ApiTags('students')
  @ApiOperation({ summary: 'Get one student educational project and its milestones' })
  @ApiOkResponse({ type: StudentProjectDto })
  getForStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentProjectId', new ParseUUIDPipe()) studentProjectId: string,
  ): Promise<StudentProjectDto> {
    return this.projectService.getStudentProject(id, studentProjectId);
  }

  @Patch('students/:id/projects/:studentProjectId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Update student project status, due date, or notes' })
  @ApiOkResponse({ type: StudentProjectDto })
  updateAssignment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentProjectId', new ParseUUIDPipe()) studentProjectId: string,
    @Body() dto: UpdateStudentProjectDto,
  ): Promise<StudentProjectDto> {
    return this.projectService.updateStudentProject(id, studentProjectId, dto);
  }

  @Patch('students/:id/projects/:studentProjectId/milestones/:milestoneId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Update milestone completion, status, due date, or mentor feedback' })
  @ApiOkResponse({ type: StudentProjectDto })
  updateMilestone(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentProjectId', new ParseUUIDPipe()) studentProjectId: string,
    @Param('milestoneId', new ParseUUIDPipe()) milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ): Promise<StudentProjectDto> {
    return this.projectService.updateMilestone(id, studentProjectId, milestoneId, dto);
  }

  @Delete('students/:id/projects/:studentProjectId')
  @Roles(...EDITOR_ROLES)
  @ApiTags('students')
  @ApiOperation({ summary: 'Unassign an educational project from a student' })
  @ApiOkResponse({ type: StudentProjectSummaryDto })
  unassign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentProjectId', new ParseUUIDPipe()) studentProjectId: string,
  ): Promise<StudentProjectSummaryDto> {
    return this.projectService.unassign(id, studentProjectId);
  }
}
