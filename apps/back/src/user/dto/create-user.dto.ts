import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Rol } from '../enums/Rol';
import { LoginDto } from 'src/auth/dtos/Login.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto extends LoginDto {
  @ApiPropertyOptional({ type: Number, default: 0, minimum: 0 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  eco_points?: number;

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
