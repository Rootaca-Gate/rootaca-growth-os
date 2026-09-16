import {
  Body,
  Controller,
  Get,
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
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginatedStudentsDto } from './dto/paginated-students.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth('JWT')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List students with search, filters, sorting, and pagination' })
  @ApiOkResponse({ type: PaginatedStudentsDto })
  findAll(@Query() query: QueryStudentsDto): Promise<PaginatedStudentsDto> {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by id' })
  @ApiOkResponse({ type: StudentResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<StudentResponseDto> {
    return this.studentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a student' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  create(@Body() dto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace student profile fields' })
  @ApiOkResponse({ type: StudentResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update student status' })
  @ApiOkResponse({ type: StudentResponseDto })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStudentStatusDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.updateStatus(id, dto.status);
  }
}
