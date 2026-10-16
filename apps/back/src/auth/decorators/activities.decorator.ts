import { SetMetadata } from '@nestjs/common';
import { Activity } from 'src/user/enums';

export const ACTIVITY_KEY = 'activities';
export const Activities = (...args: Activity[]): MethodDecorator =>
  SetMetadata(ACTIVITY_KEY, args);
