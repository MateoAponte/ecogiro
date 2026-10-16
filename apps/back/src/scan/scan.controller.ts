import {
  Controller,
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

@Controller('scan')
@ApiTags('scan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly service: ScanService) {}

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
    description: 'OpenAI configuration or quota unavailable',
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
