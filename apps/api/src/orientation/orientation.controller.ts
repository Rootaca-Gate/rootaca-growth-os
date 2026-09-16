import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateOrientationSessionDto } from './dto/create-session.dto';
import { QueryOrientationSessionsDto } from './dto/query-sessions.dto';
import { SaveOrientationSessionDto } from './dto/save-session.dto';
import {
  AssessmentResultResponseDto,
  OrientationSessionResponseDto,
  OrientationSessionSummaryDto,
} from './dto/session-response.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { OrientationService } from './orientation.service';

@ApiTags('orientation')
@ApiBearerAuth('JWT')
@Controller('orientation-sessions')
export class OrientationController {
  constructor(private readonly orientationService: OrientationService) {}

  @Get()
  @ApiOperation({ summary: 'List orientation sessions, optionally by student' })
  @ApiOkResponse({ type: [OrientationSessionSummaryDto] })
  findAll(@Query() query: QueryOrientationSessionsDto): Promise<OrientationSessionSummaryDto[]> {
    return this.orientationService.findAll(query.studentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an orientation session (or return the open one)' })
  @ApiCreatedResponse({ type: OrientationSessionResponseDto })
  create(
    @Body() dto: CreateOrientationSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrientationSessionResponseDto> {
    return this.orientationService.create(dto.studentId, user.id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get the assessment result for a completed session' })
  @ApiOkResponse({ type: AssessmentResultResponseDto })
  getResult(@Param('id', new ParseUUIDPipe()) id: string): Promise<AssessmentResultResponseDto> {
    return this.orientationService.getResult(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an orientation session with questions and answers' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrientationSessionResponseDto> {
    return this.orientationService.findOne(id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the 20-minute orientation timer' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  start(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrientationSessionResponseDto> {
    return this.orientationService.start(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause the orientation timer' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  pause(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrientationSessionResponseDto> {
    return this.orientationService.pause(id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused orientation timer' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  resume(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrientationSessionResponseDto> {
    return this.orientationService.resume(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Save notes, current stage, and optional answers' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  save(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveOrientationSessionDto,
  ): Promise<OrientationSessionResponseDto> {
    return this.orientationService.save(id, dto);
  }

  @Put(':id/answers')
  @ApiOperation({ summary: 'Submit or update assessment answers without completing' })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  submitAnswers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAnswersDto,
  ): Promise<OrientationSessionResponseDto> {
    return this.orientationService.submitAnswers(id, dto.answers);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete the session and calculate scores. Allowed after 20 minutes.',
  })
  @ApiOkResponse({ type: OrientationSessionResponseDto })
  complete(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrientationSessionResponseDto> {
    return this.orientationService.complete(id);
  }
}
