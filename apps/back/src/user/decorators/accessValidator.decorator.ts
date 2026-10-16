import { applyDecorators } from '@nestjs/common';
import { Rol } from '../enums';
import { Roles } from 'src/auth/decorators';

type AccessValidatorOptions = {
  roles?: Rol[];
};

export const AccessValidator = ({
  roles = [],
}: AccessValidatorOptions = {}): MethodDecorator =>
  applyDecorators(Roles(Rol.ADMIN, ...roles));
