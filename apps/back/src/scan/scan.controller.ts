import {
  Controller,
  Req,
  ParseUUIDPipe,
  Body,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AnalyzeResponseDto } from './dto/analyze-output.dto';
import { MAX_SCAN_IMAGE_BYTES, ScanImagePipe } from './pipes/scan-image.pipe';
import type { ScanImageFile } from './pipes/scan-image.pipe';
import { ScanService } from './scan.service';
import { ScanAnalysisPipe } from './pipes/scan-analysis.pipe';
import { ScanAchievedProvider } from './providers/scan-achieved.provider';
import type { IAuthRequest } from '../auth/interfaces/IAuthRequest';

@Controller('scan')
@ApiTags('scan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(
    private readonly service: ScanService,
    private readonly achievedProvider: ScanAchievedProvider,
  ) {}

  @Post('achieved')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Verify a collection photo and issue a temporary completion receipt',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'recovery_id'],
      properties: {
        file: { type: 'string', format: 'binary' },
        recovery_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_SCAN_IMAGE_BYTES,
        files: 1,
        fields: 1,
        fieldSize: 100,
      },
    }),
  )
  achieved(
    @UploadedFile(ScanImagePipe) file: ScanImageFile,
    @Body('recovery_id', new ParseUUIDPipe({ version: '4' }))
    recoveryId: string,
    @Req() request: IAuthRequest,
  ) {
    return this.achievedProvider.achieved(
      file,
      recoveryId,
      request.user.id!,
      request.user.rol!,
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify analysis against the original image and calculate estimated points',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'analysis'],
      properties: {
        file: { type: 'string', format: 'binary' },
        analysis: {
          type: 'string',
          description: 'JSON returned in Analyze data',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_SCAN_IMAGE_BYTES,
        files: 1,
        fields: 1,
        fieldSize: 32000,
      },
    }),
  )
  verify(
    @UploadedFile(ScanImagePipe) file: ScanImageFile,
    // Multipart JSON arrives as a string. Let the dedicated pipe parse it before DTO validation.
    @Body('analysis', ScanAnalysisPipe) analysis: unknown,
  ) {
    return this.service.verify(file, analysis as AnalyzeResponseDto);
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Beta: analyze visible plastics without creating a scan or recovery',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: AnalyzeResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Missing photo or invalid image format',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired access token' })
  @ApiResponse({ status: 413, description: 'Image exceeds 5 MB' })
  @ApiResponse({
    status: 422,
    description: 'No identifiable plastic or image cannot be analyzed',
  })
  @ApiResponse({
    status: 502,
    description: 'Invalid or inconsistent AI response',
  })
  @ApiResponse({
    status: 503,
    description: 'Gemini configuration or quota unavailable',
  })
  @ApiResponse({ status: 504, description: 'AI timeout' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SCAN_IMAGE_BYTES, files: 1 },
    }),
  )
  analyze(
    @UploadedFile(ScanImagePipe) file: ScanImageFile,
  ): Promise<AnalyzeResponseDto> {
    return this.service.analyze(file);
  }
}
