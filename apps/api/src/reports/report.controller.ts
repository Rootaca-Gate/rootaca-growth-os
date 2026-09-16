import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ReportQueryDto } from './dto/report-query.dto';
import { StudentProgressReportDto } from './dto/report-response.dto';
import { ReportService } from './report.service';

@ApiBearerAuth('JWT')
@ApiTags('students')
@Controller('students/:id')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('report')
  @ApiOperation({ summary: 'Live student progress report preview (JSON)' })
  @ApiOkResponse({ type: StudentProgressReportDto })
  preview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ReportQueryDto,
  ): Promise<StudentProgressReportDto> {
    return this.reportService.getReport(id, query.locale ?? 'en');
  }

  @Get('report.pdf')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Generate a ROOTACA-branded student progress PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'PDF binary',
    schema: { type: 'string', format: 'binary' },
  })
  async pdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ReportQueryDto,
  ): Promise<StreamableFile> {
    const { buffer, fileName } = await this.reportService.renderPdf(id, query.locale ?? 'en');
    const asciiName = fileName.replace(/[^\u0020-\u007E]/g, '_');
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      length: buffer.length,
    });
  }
}
