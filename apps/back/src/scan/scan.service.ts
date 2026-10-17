import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AnalyzeResponseDto } from './dto/analyze-output.dto';
import { ScanAnalyzerProvider } from './providers/scan-analyzer.provider';
import type { ScanImageFile } from './pipes/scan-image.pipe';
import { ScanVerifierProvider } from './providers/scan-verifier.provider';
import { calculateScanPoints } from './scan-points';

@Injectable()
export class ScanService {
  constructor(
    private readonly analyzer: ScanAnalyzerProvider,
    private readonly verifier: ScanVerifierProvider,
  ) {}

  async verify(image: ScanImageFile, analysis: AnalyzeResponseDto) {
    let candidate = analysis;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await this.verifier.verify(image, candidate);
      if (result.matches) {
        return {
          ...candidate,
          eco_points: calculateScanPoints(result.items, candidate.weight_estimate).points,
        };
      }
      if (attempt === 1) {
        try {
          candidate = await this.analyze(image, result.issues);
        } catch (error) {
          if (!(error instanceof UnprocessableEntityException)) throw error;
          break;
        }
      }
    }
    throw new UnprocessableEntityException(
      'Se requiere una foto más clara de los elementos a recolectar.',
    );
  }

  async analyze(
    image: ScanImageFile,
    feedback?: string[],
  ): Promise<AnalyzeResponseDto> {
    const result = await this.analyzer.analyze(image, feedback);
    if (!result.is_plastic) {
      throw new UnprocessableEntityException(
        result.reason_invalid || 'No se identificó plástico en la foto.',
      );
    }
    if (
      result.reason_invalid !== null ||
      typeof result.weight_estimate !== 'number' ||
      !(result.weight_estimate > 0) ||
      [
        result.materials,
        result.preparation,
        result.impact,
        result.environmental_damage,
      ].some((items) => !items.length || items.some((item) => !item.trim()))
    ) {
      throw new BadGatewayException(
        'El análisis del proveedor es inconsistente. Intenta nuevamente.',
      );
    }
    const response = new AnalyzeResponseDto();
    response.materials = result.materials;
    response.preparation = result.preparation.map(
      (step, index) =>
        `${index + 1}. ${step.replace(/^\s*\d+[.)]\s*/, '').trim()}`,
    );
    response.impact = result.impact;
    response.environmental_damage = result.environmental_damage;
    response.weight_estimate = result.weight_estimate;
    return response;
  }
}
