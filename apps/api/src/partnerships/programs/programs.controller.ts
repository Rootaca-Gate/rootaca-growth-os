import {
  Body,
  Controller,
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
  CreateProgramDto,
  PaginatedProgramsDto,
  ProgramResponseDto,
  QueryProgramsDto,
  UpdateProgramDto,
} from './dto/program.dto';
import { ProgramsService } from './programs.service';

@ApiTags('partnerships-programs')
@ApiBearerAuth('JWT')
@Controller('partnerships/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedProgramsDto })
  findAll(@Query() query: QueryProgramsDto): Promise<PaginatedProgramsDto> {
    return this.programsService.findAll(query);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ProgramResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProgramResponseDto> {
    return this.programsService.findOne(id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ProgramResponseDto })
  create(
    @Body() dto: CreateProgramDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProgramResponseDto> {
    return this.programsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProgramResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProgramDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProgramResponseDto> {
    return this.programsService.update(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProgramResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProgramResponseDto> {
    return this.programsService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ProgramResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProgramResponseDto> {
    return this.programsService.duplicate(id, user.id);
  }
}
