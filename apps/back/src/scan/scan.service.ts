import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AnalyzeResponseDto } from './dto/analyze-output.dto';
import { ScanAnalyzerProvider } from './providers/scan-analyzer.provider';
import type { ScanImageFile } from './pipes/scan-image.pipe';

@Injectable()
export class ScanService {
  constructor(private readonly analyzer: ScanAnalyzerProvider) {}

  async analyze(image: ScanImageFile): Promise<AnalyzeResponseDto> {
    const result = await this.analyzer.analyze(image);
    if (!result.es_plastico) {
      throw new UnprocessableEntityException(
        result.motivo_invalido || 'No se identificó plástico en la foto.',
      );
    }
    if (
      result.motivo_invalido !== null ||
      typeof result.peso_estimado !== 'number' ||
      !(result.peso_estimado > 0) ||
      [
        result.materiales,
        result.preparacion,
        result.impacto_inmediato,
        result.daño_ambiental,
      ].some((items) => !items.length || items.some((item) => !item.trim()))
    ) {
      throw new BadGatewayException(
        'El análisis del proveedor es inconsistente. Intenta nuevamente.',
      );
    }
    const response = new AnalyzeResponseDto();
    response.materiales = result.materiales;
    response.preparacion = result.preparacion.map(
      (step, index) =>
        `${index + 1}. ${step.replace(/^\s*\d+[.)]\s*/, '').trim()}`,
    );
    response.impacto_inmediato = result.impacto_inmediato;
    response.daño_ambiental = result.daño_ambiental;
    response.peso_estimado = result.peso_estimado;
    return response;
  }
}
