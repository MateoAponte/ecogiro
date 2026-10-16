import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, TokenDto, TokenUserDto } from './dtos';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import {
  LoginDocumentation,
  RefreshDocumentation,
} from './decorators/authDocumentation.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Inject Auth Service
     */
    private readonly authService: AuthService,
  ) {}

  @LoginDocumentation()
  @Post('login')
  login(@Body() body: LoginDto): Promise<TokenUserDto> {
    return this.authService.login(body);
  }

  @RefreshDocumentation()
  @UseGuards(AuthGuard('refresh-token'))
  @Post('refresh')
  refresh(@Req() req: Request): TokenUserDto {
    const authHeader = req.headers.authorization;
    if (authHeader == null || authHeader == undefined)
      throw new UnauthorizedException('No authorization header found');

    const refreshToken = authHeader.split(' ')[1];
    return this.authService.refresh(refreshToken);
  }

  @Post('encrypt')
  encrypt(@Body() encrypt: TokenDto): TokenDto {
    return this.authService.encrypt(encrypt);
  }
}
