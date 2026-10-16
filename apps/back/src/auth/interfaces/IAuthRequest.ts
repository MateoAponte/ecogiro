import type { Request } from 'express';
import { User } from 'src/user/user.entity';

export interface IAuthRequest extends Request {
  user: Partial<User>;
}
