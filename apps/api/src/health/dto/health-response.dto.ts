import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'rootaca-api' })
  service!: string;

  @ApiProperty({ example: '2026-09-16T00:56:00.000Z' })
  timestamp!: string;
}
