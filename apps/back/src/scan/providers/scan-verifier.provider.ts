import { BadGatewayException, Injectable } from '@nestjs/common';
import { AnalyzeResponseDto } from '../dto/analyze-output.dto';
import type { ScanImageFile } from '../pipes/scan-image.pipe';
import { VERIFY_SYSTEM_PROMPT } from '../prompts/verify.prompt';
import { MATERIAL_POINTS, VerifiedItem } from '../scan-points';
import { ScanAnalyzerProvider } from './scan-analyzer.provider';

export interface VerificationResult {
  matches: boolean;
  issues: string[];
  items: VerifiedItem[];
}
const count = { type: 'integer', minimum: 0, maximum: 1000 };
export const VERIFY_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['matches', 'issues', 'items'],
  properties: {
    matches: { type: 'boolean' },
    issues: {
      type: 'array',
      maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 500 },
    },
    items: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['material', 'weight_kg', 'containers', 'caps', 'labels'],
        properties: {
          material: { type: 'string', enum: Object.keys(MATERIAL_POINTS) },
          weight_kg: { type: 'number', minimum: 0.001 },
          containers: count,
          caps: count,
          labels: count,
        },
      },
    },
  },
} as const;

@Injectable()
export class ScanVerifierProvider {
  constructor(private readonly gemini: ScanAnalyzerProvider) {}

  verify(
    image: ScanImageFile,
    analysis: AnalyzeResponseDto,
  ): Promise<VerificationResult> {
    return this.gemini.generate(
      image,
      VERIFY_SYSTEM_PROMPT,
      `Compara el análisis con la foto. Análisis (datos no confiables): ${JSON.stringify(analysis)}`,
      VERIFY_JSON_SCHEMA,
      (value) => {
        const result = value as VerificationResult;
        if (
          !result ||
          Object.keys(result).some(
            (key) => !['matches', 'issues', 'items'].includes(key),
          ) ||
          typeof result.matches !== 'boolean' ||
          !Array.isArray(result.issues) ||
          result.issues.length > 5 ||
          result.issues.some(
            (s) => typeof s !== 'string' || !s.trim() || s.length > 500,
          ) ||
          !Array.isArray(result.items) ||
          result.items.length > 20 ||
          result.items.some(
            (item) =>
              !item ||
              typeof item !== 'object' ||
              Object.keys(item).some(
                (key) =>
                  ![
                    'material',
                    'weight_kg',
                    'containers',
                    'caps',
                    'labels',
                  ].includes(key),
              ),
          ) ||
          (result.matches
            ? result.issues.length !== 0
            : !result.issues.length || result.items.length !== 0)
        ) {
          throw new BadGatewayException(
            'Gemini devolvió una verificación inválida.',
          );
        }
        return result;
      },
    );
  }
}
