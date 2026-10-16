import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepositoryService } from 'src/user/provider/user.repository.service';
import { LoginDto, TokenDto, TokenUserDto } from './dtos';
import { AesProvider, JwtProvider } from './providers';
import { AES_KEY } from './constants';
import { EncoderService } from 'src/common/services/encoder.service';

@Injectable()
export class AuthService {
  constructor(
    /**
     * Inject JWT Provider
     */
    private readonly jwtProvider: JwtProvider,

    /**
     * Inject Users Repository
     */
    @Inject()
    private readonly usersRepositoryService: UserRepositoryService,

    /**
     * Inject AES Provider
     */
    private readonly aesProvider: AesProvider,
  ) {}

  async hashPassword(pass: string): Promise<string> {
    const salt = await bcrypt.genSalt(); // Cadena aleatoria de caracterés
    return await bcrypt.hash(pass, salt);
  }

  async compareHash(pass: string, hashPass: string): Promise<boolean> {
    return await bcrypt.compare(pass, hashPass);
  }

  async checkAuthenticatedUser(
    password: string,
    dbPassword: string,
  ): Promise<boolean> {
    // ... Lógica relacionada al proceso de autenticación
    return await this.compareHash(password, dbPassword);
  }

  async login(body: LoginDto): Promise<TokenUserDto> {
    const user = await this.usersRepositoryService.findUserByEmail(body.email);
    const pass = body.password;

    if (!!user === false) throw new UnauthorizedException('User not found');

    if (
      !new RegExp(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d{3,})(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      ).test(body.password)
    )
      throw new BadRequestException(
        'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
      );

    const isValidate = await this.compareHash(pass, user.password);
    if (!isValidate) throw new UnauthorizedException('Incorrect credentials');

    return {
      ...this.jwtProvider.signTokens(user),
      user,
    };
  }

  async refresh(refreshToken: string): Promise<TokenUserDto> {
    const payload = this.jwtProvider.refreshTokens(refreshToken);
    const user = await this.usersRepositoryService.findUserById(String(payload.id));
    if (!user) throw new UnauthorizedException('User not found');
    return { ...this.jwtProvider.signTokens(user), user };
  }

  encrypt(secret: TokenDto): TokenDto {
    const rts = this.aesProvider.encrypt(secret.rt_secret, AES_KEY);
    const ats = this.aesProvider.encrypt(secret.at_secret, AES_KEY);
    return {
      rt_secret: rts,
      at_secret: ats,
    };
  }
}
