import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AesProvider } from './aes-provider';
import { User } from 'src/user/user.entity';
import { AES_KEY, RT_SECRET } from '../constants';
import { TokenUserDto } from '../dtos';

@Injectable()
export class JwtRtstrategy extends PassportStrategy(Strategy, 'refresh-token') {
  constructor(
    /**
     * Inject AES Provider
     */
    readonly aesProvider: AesProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: aesProvider.decrypt(RT_SECRET, AES_KEY),
    });
  }

  validate(payload: User): TokenUserDto {
    return {
      id: payload.id,
      email: payload.email,
      rol: payload.rol,
      activities: payload.activities,
      name: payload.name,
    };
  }
}
