import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../enums';
import { User } from '../user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 0, type: Number })
  eco_points: number;

  @ApiProperty({
    example: 1,
    description: 'User Id by User',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'User Name',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'User Phone',
    type: 'string',
  })
  phone: string;

  @ApiProperty({
    example: 'Calle 68 Sur #49-21',
    description: 'User Address',
    type: 'string',
  })
  address: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User Email',
    type: 'string',
  })
  email: string;

  @ApiProperty({
    enum: Rol,
    enumName: 'Rol',
    description: 'User Role as number',
  })
  rol: Rol;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.rol = user.rol;
    dto.phone = user.phone;
    dto.address = user.address;
    dto.eco_points = user.eco_points;
    return dto;
  }
}
