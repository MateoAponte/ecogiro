import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recovery } from './recovery.entity';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './provider/recovery.service';
import { RecoveryRepository } from './provider/recovery.repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recovery])],
  controllers: [RecoveryController],
  providers: [RecoveryService, RecoveryRepository],
})
export class RecoveryModule {}
