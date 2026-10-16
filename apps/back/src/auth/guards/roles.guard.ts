import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROL_KEY } from '../decorators/roles.decorator';
import { Rol } from 'src/user/enums/Rol';
import { IAuthRequest } from '../interfaces/IAuthRequest';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Nos permite leer la meta-data

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request: IAuthRequest = context.switchToHttp().getRequest();
    const { user } = request;

    if (user.rol == undefined)
      throw new ForbiddenException(
        "User doesn't permission to access this resource",
      );
    else {
      const hasPermission = requiredRoles.some((rol) => user?.rol === rol);
      if (hasPermission) return true;
      else
        throw new ForbiddenException(
          "User doesn't permission to access this resource",
        );
    }
  }
}
