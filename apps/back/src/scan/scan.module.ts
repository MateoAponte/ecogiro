import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { ScanAnalyzerProvider } from './providers/scan-analyzer.provider';
import { ScanImagePipe } from './pipes/scan-image.pipe';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [ScanController],
  providers: [ScanService, ScanAnalyzerProvider, ScanImagePipe],
})
export class ScanModule {}
