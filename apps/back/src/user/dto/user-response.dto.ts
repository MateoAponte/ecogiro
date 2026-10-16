import { ApiProperty } from '@nestjs/swagger';
import { Activity, Rol } from '../enums';
import { User } from '../user.entity';
import { ObjectId } from 'typeorm';

export class UserResponseDto {
  @ApiProperty({
    example: 'acXaG0xH5+gzPdqJ',
    description: 'User Id by User',
    type: 'string',
  })
  id: string;

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

  @ApiProperty({
    type: 'string',
    isArray: true,
    description: 'User Favorites',
    example: [80, 102, 124, 308, 344, 655],
  })
  favorities: number[];

  @ApiProperty({
    type: 'string',
    isArray: true,
    description: 'User Team',
    example: [80, 102, 124, 308, 344, 655],
  })
  team: number[];

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = new ObjectId(user._id).toHexString();
    dto.name = user.name;
    dto.email = user.email;
    dto.rol = user.rol;
    dto.favorities = user.favorities || [];
    dto.team = user.team || [];
    dto.activities = user.activities;
    return dto;
  }
}
