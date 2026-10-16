import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import {
  AesProvider,
  JwtAtStrategy,
  JwtProvider,
  JwtRtstrategy,
} from './providers';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAtStrategy,
    JwtRtstrategy,
    JwtProvider,
    AesProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
