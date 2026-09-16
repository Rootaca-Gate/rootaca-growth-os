import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@rootaca.com' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'DevAdmin#2026' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
