import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Medail } from './medail.entity';
import { MedailController } from './medail.controller';
import { MedailService } from './provider/medail.service';
import { MedailRepository } from './provider/medail.repository.service';
import { Recovery } from '../collections/recovery.entity';
import { UserMedail } from './user-medail.entity';
import { UserMedailService } from './provider/user-medail.service';
import { UserMedailController } from './user-medail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Medail, User, Recovery, UserMedail])],
  controllers: [MedailController, UserMedailController],
  providers: [MedailService, MedailRepository, UserMedailService],
  exports: [UserMedailService],
})
export class MedailModule {}
