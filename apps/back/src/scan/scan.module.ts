import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recovery } from '../collections/recovery.entity';
import { ScanAchievedProvider } from './providers/scan-achieved.provider';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { ScanAnalyzerProvider } from './providers/scan-analyzer.provider';
import { ScanImagePipe } from './pipes/scan-image.pipe';
import { ScanAnalysisPipe } from './pipes/scan-analysis.pipe';
import { ScanVerifierProvider } from './providers/scan-verifier.provider';

@Module({
  imports: [ConfigModule, AuthModule, TypeOrmModule.forFeature([Recovery])],
  exports: [ScanAchievedProvider],
  controllers: [ScanController],
  providers: [
    ScanAchievedProvider,
    ScanService,
    ScanAnalyzerProvider,
    ScanVerifierProvider,
    ScanImagePipe,
    ScanAnalysisPipe,
  ],
})
export class ScanModule {}
