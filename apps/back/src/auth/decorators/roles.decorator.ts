import { SetMetadata } from '@nestjs/common';
import { Rol } from 'src/user/enums/Rol';

export const ROL_KEY = 'rol';
export const Roles = (...args: Rol[]): MethodDecorator =>
  SetMetadata(ROL_KEY, args);
