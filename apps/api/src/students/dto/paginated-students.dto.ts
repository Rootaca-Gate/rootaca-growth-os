import { ApiProperty } from '@nestjs/swagger';
import { StudentResponseDto } from './student-response.dto';

export class PaginatedStudentsDto {
  @ApiProperty({ type: [StudentResponseDto] })
  items!: StudentResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
