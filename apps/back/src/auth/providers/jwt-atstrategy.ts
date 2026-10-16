import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/user/user.entity';
import { AesProvider } from './aes-provider';
import { TokenUserDto } from '../dtos';
import { AES_KEY, AT_SECRET } from '../constants';

@Injectable() // Yo le dire que hacer con al Access Token
export class JwtAtStrategy extends PassportStrategy(Strategy, 'token') {
  constructor(
    /**
     * Inject AES Provider
     */
    readonly aesProvider: AesProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: aesProvider.decrypt(AT_SECRET, AES_KEY),
    });
  }

  validate(payload: User): TokenUserDto {
    return {
      id: payload.id,
      email: payload.email,
      rol: payload.rol,
      activities: payload.activities,
    };
  }
}
