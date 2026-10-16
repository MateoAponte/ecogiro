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
import { Activity } from '../enums';
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

  @ApiPropertyOptional({
    type: 'array',
    isArray: true,
    enum: Activity,
    enumName: 'Activity',
    description: 'User Activities',
    example: [Activity.READER, Activity.WRITER],
  })
  @IsOptional()
  @IsEnum(Activity, { each: true })
  activities?: Activity[];

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
