import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AES_KEY, AT_SECRET, RT_SECRET } from '../constants';
import { AesProvider } from './aes-provider';
import { TokenUserDto } from '../dtos';

@Injectable()
export class JwtProvider {
  constructor(
    /**
     * Inject JWT Service by Nest
     */
    private readonly jwtService: JwtService,

    /**
     * Inject AES Provider
     */
    private readonly aesProvider: AesProvider,
  ) {}

  signTokens(token: TokenUserDto): TokenUserDto {
    const jwtPayload = {
      id: token.id,
      email: token.email,
      rol: token.rol,
      activities: token.activities,
      name: token.name,
    };

    const access_token = this.jwtService.sign(jwtPayload, {
      secret: this.aesProvider.decrypt(AT_SECRET, AES_KEY),
      expiresIn: '7d',
    });
    const refresh_token = this.jwtService.sign(jwtPayload, {
      secret: this.aesProvider.decrypt(RT_SECRET, AES_KEY),
      expiresIn: '7d',
    });
    return { at_secret: access_token, rt_secret: refresh_token };
  }

  refreshTokens(refresh_token: string): TokenUserDto {
    return this.jwtService.verify(refresh_token, {
      secret: this.aesProvider.decrypt(RT_SECRET, AES_KEY),
    });
  }
}
