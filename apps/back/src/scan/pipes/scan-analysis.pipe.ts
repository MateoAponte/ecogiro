import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AnalyzeResponseDto } from '../dto/analyze-output.dto';

@Injectable()
export class ScanAnalysisPipe implements PipeTransform {
  transform(value: unknown): AnalyzeResponseDto {
    try {
      if (typeof value !== 'string' || value.length > 32000) throw new Error();
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error();
      const result = plainToInstance(AnalyzeResponseDto, parsed);
      if (
        validateSync(result, { whitelist: true, forbidNonWhitelisted: true })
          .length ||
        [
          result.materials,
          result.preparation,
          result.impact,
          result.environmental_damage,
        ].some((items) => !items.length || items.some((item) => !item.trim()))
      )
        throw new Error();
      return result;
    } catch {
      throw new BadRequestException(
        'analysis debe contener el JSON válido retornado por Analyze.',
      );
    }
  }
}
