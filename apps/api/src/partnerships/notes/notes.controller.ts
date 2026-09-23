import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  CreateNoteDto,
  NoteResponseDto,
  PaginatedNotesDto,
  QueryNotesDto,
  UpdateNoteDto,
} from './dto/note.dto';
import { NotesService } from './notes.service';

@ApiTags('partnerships-notes')
@ApiBearerAuth('JWT')
@Controller('partnerships')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('institutions/:institutionId/notes')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedNotesDto })
  findByInstitution(
    @Param('institutionId', new ParseUUIDPipe()) institutionId: string,
    @Query() query: QueryNotesDto,
  ): Promise<PaginatedNotesDto> {
    return this.notesService.findByInstitution(institutionId, query);
  }

  @Post('institutions/:institutionId/notes')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: NoteResponseDto })
  create(
    @Param('institutionId', new ParseUUIDPipe()) institutionId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(institutionId, dto, user.id);
  }

  @Patch('notes/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: NoteResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, dto, user.id);
  }

  @Delete('notes/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: NoteResponseDto })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NoteResponseDto> {
    return this.notesService.remove(id, user.id);
  }
}
