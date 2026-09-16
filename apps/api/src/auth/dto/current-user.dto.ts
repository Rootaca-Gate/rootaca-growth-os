import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CurrentUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin@rootaca.com' })
  email!: string;

  @ApiProperty({ example: 'ROOTACA Admin' })
  displayName!: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role!: Role;
}
