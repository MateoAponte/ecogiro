import { applyDecorators } from '@nestjs/common';
import { Activity, Rol } from '../enums';
import { Activities, Roles } from 'src/auth/decorators';

type AccessValidatorOptions = {
  roles?: Rol[];
  activities?: Activity[];
};

export const AccessValidator = ({
  roles = [],
  activities = [],
}: AccessValidatorOptions = {}): MethodDecorator =>
  applyDecorators(
    Roles(Rol.ADMIN, ...roles),
    Activities(Activity.ADMIN, ...activities),
  );
