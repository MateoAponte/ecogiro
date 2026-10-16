import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './provider/user.service';
import { UserController } from './user.controller';
import { UserRepositoryService } from './provider/user.repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PokemonModule } from 'src/pokemon/pokemon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    PokemonModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepositoryService],
  exports: [UserRepositoryService],
})
export class UserModule {}
