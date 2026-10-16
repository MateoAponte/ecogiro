import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ACTIVITY_KEY } from '../decorators/activities.decorator';
import { IAuthRequest } from '../interfaces/IAuthRequest';
import { Activity } from 'src/user/enums';

@Injectable()
export class ActivitiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Nos permite leer la meta-data

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredActivities = this.reflector.getAllAndOverride<Activity[]>(
      ACTIVITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredActivities) return true;

    const request: IAuthRequest = context.switchToHttp().getRequest();
    const { user } = request;

    if (user.activities == undefined)
      throw new ForbiddenException(
        "User doesn't permission to access this resource",
      );
    else {
      const hasPermission = requiredActivities.some(
        (activity) =>
          (user?.activities ?? []).findIndex(
            (userActivity) => userActivity === activity,
          ) > -1,
      );
      if (hasPermission) return true;
      else
        throw new ForbiddenException(
          "User doesn't permission to access this resource",
        );
    }
  }
}
