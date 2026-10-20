import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recovery } from './recovery.entity';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './provider/recovery.service';
import { RecoveryRepository } from './provider/recovery.repository.service';
import { RecoveryEventsService } from './events/recovery-events.service';
import { ScanModule } from '../scan/scan.module';

@Module({
  imports: [TypeOrmModule.forFeature([Recovery]), ScanModule],
  controllers: [RecoveryController],
  providers: [RecoveryService, RecoveryRepository, RecoveryEventsService],
  exports: [RecoveryEventsService],
})
export class RecoveryModule {}
