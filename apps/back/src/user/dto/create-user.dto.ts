import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../enums/Rol';
import { LoginDto } from 'src/auth/dtos/Login.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto extends LoginDto {
  @ApiProperty({
    type: 'string',
    description: 'User Name',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: 'string',
    description: 'User Phone',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: 'string',
    description: 'User Address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    enum: Rol,
    enumName: 'Rol',
    description: 'User Role as number',
    example: Rol.USER,
  })
  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;
}
