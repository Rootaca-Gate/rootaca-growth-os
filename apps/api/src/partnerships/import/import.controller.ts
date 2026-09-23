import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  ImportJobDto,
  ImportMappingDto,
  ImportPreviewResponseDto,
  PaginatedImportJobsDto,
  PaginatedImportRowsDto,
  QueryImportHistoryDto,
  QueryImportRowsDto,
  UpdateImportDecisionsDto,
} from './dto/import.dto';
import { IMPORT_MAX_FILE_BYTES } from './import.constants';
import { ImportService } from './import.service';

@ApiTags('partnerships-import')
@ApiBearerAuth('JWT')
@Controller('partnerships/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @Roles(...CRM_WRITE_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: IMPORT_MAX_FILE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        mapping: {
          type: 'string',
          description: 'Optional JSON string of CSV header → CRM field mapping',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload CSV and build import preview (staged job)' })
  @ApiOkResponse({ type: ImportPreviewResponseDto })
  preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('mapping') mapping: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportPreviewResponseDto> {
    return this.importService.preview(file, mapping, user.id);
  }

  @Post('jobs/:id/remap')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Re-run validation/dedupe with a new column mapping' })
  @ApiOkResponse({ type: ImportPreviewResponseDto })
  remap(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ImportMappingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportPreviewResponseDto> {
    return this.importService.remap(id, dto.mapping, user.id);
  }

  @Get('jobs/:id')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'Get import job preview (with optional row filter)' })
  @ApiOkResponse({ type: ImportPreviewResponseDto })
  getJob(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: QueryImportRowsDto,
  ): Promise<ImportPreviewResponseDto> {
    return this.importService.getPreview(id, query);
  }

  @Get('jobs/:id/rows')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'Paginate staged import rows' })
  @ApiOkResponse({ type: PaginatedImportRowsDto })
  listRows(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: QueryImportRowsDto,
  ): Promise<PaginatedImportRowsDto> {
    return this.importService.listRows(id, query);
  }

  @Patch('jobs/:id/decisions')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update per-row or bulk import decisions' })
  @ApiOkResponse({ type: ImportJobDto })
  updateDecisions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateImportDecisionsDto,
  ): Promise<ImportJobDto> {
    return this.importService.updateDecisions(id, dto);
  }

  @Post('jobs/:id/execute')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Execute approved import decisions (re-checks duplicates)' })
  @ApiOkResponse({ type: ImportJobDto })
  execute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportJobDto> {
    return this.importService.execute(id, user.id);
  }

  @Get('history')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'List CSV import jobs' })
  @ApiOkResponse({ type: PaginatedImportJobsDto })
  history(@Query() query: QueryImportHistoryDto): Promise<PaginatedImportJobsDto> {
    return this.importService.history(query);
  }

  @Get('history/:id')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'Import job detail with rows' })
  @ApiOkResponse({ type: ImportPreviewResponseDto })
  historyOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ImportPreviewResponseDto> {
    return this.importService.historyOne(id);
  }
}
