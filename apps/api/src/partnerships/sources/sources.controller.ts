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
import { CRM_ADMIN_ROLES, CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  CreateSourceDto,
  PaginatedSourcesDto,
  QuerySourcesDto,
  SourceResponseDto,
  UpdateSourceDto,
} from './dto/source.dto';
import { SourcesService } from './sources.service';

@ApiTags('partnerships-sources')
@ApiBearerAuth('JWT')
@Controller('partnerships/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedSourcesDto })
  findAll(@Query() query: QuerySourcesDto): Promise<PaginatedSourcesDto> {
    return this.sourcesService.findAll(query);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: SourceResponseDto })
  create(
    @Body() dto: CreateSourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SourceResponseDto> {
    return this.sourcesService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: SourceResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SourceResponseDto> {
    return this.sourcesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(...CRM_ADMIN_ROLES)
  @ApiOkResponse({ description: 'Deleted when unreferenced; 409 if referenced' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.sourcesService.remove(id);
  }
}
