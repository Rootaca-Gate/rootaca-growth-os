import { OmitType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';

export class UpdateStudentDto extends OmitType(CreateStudentDto, ['status'] as const) {}
