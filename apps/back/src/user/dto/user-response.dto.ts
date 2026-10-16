import { ApiProperty } from '@nestjs/swagger';
import { Activity, Rol } from '../enums';
import { User } from '../user.entity';

export class UserResponseDto {
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

  @ApiProperty({
    enum: Activity,
    isArray: true,
    description: 'User Activities',
  })
  activities: Activity[];

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.rol = user.rol;
    dto.activities = user.activities;
    return dto;
  }
}
