import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AnalyzeModelOutputDto } from '../dto/analyze-output.dto';
import {
  ANALYZE_SYSTEM_PROMPT,
  ANALYZE_USER_PROMPT,
} from '../prompts/analyze.prompt';
import { ANALYZE_JSON_SCHEMA } from '../schemas/analyze.schema';
import type { ScanImageFile } from '../pipes/scan-image.pipe';

@Injectable()
export class ScanAnalyzerProvider {
  constructor(private readonly config: ConfigService) {}

  async analyze(image: ScanImageFile): Promise<AnalyzeModelOutputDto> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey?.trim()) {
      throw new ServiceUnavailableException(
        'Configura OPENAI_API_KEY en el backend para habilitar Analyze.',
      );
    }
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: this.config.get<string>('OPENAI_SCAN_MODEL') || 'gpt-4.1-mini',
          store: false,
          max_output_tokens: 2000,
          instructions: ANALYZE_SYSTEM_PROMPT,
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: ANALYZE_USER_PROMPT },
                {
                  type: 'input_image',
                  image_url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`,
                  detail: 'high',
                },
              ],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'plastic_analysis',
              strict: true,
              schema: ANALYZE_JSON_SCHEMA,
            },
          },
        }),
      });
      if (!response.ok) await this.throwProviderError(response);

      const payload: unknown = await response.json();
      return this.parseResponse(payload);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(error.name)
      ) {
        throw new GatewayTimeoutException(
          'El análisis tardó demasiado. Intenta nuevamente.',
        );
      }
      throw new BadGatewayException(
        'No se pudo obtener un análisis válido del proveedor de IA.',
      );
    }
  }

  private async throwProviderError(response: Response): Promise<never> {
    const payload: unknown = await response.json().catch(() => null);
    const error =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object'
        ? payload.error
        : null;
    const code = error && 'code' in error ? error.code : null;
    const type = error && 'type' in error ? error.type : null;

    // Map known codes; never forward raw provider messages (they may contain secrets).
    if (response.status === 401) {
      throw new ServiceUnavailableException(
        'OpenAI rechazó la API key. Revisa OPENAI_API_KEY y reinicia el backend.',
      );
    }
    if (response.status === 403) {
      throw new ServiceUnavailableException(
        'OpenAI rechazó el acceso. Revisa los permisos y restricciones de tu proyecto.',
      );
    }
    if (response.status === 429) {
      if (code === 'credit_balance_exhausted') {
        throw new ServiceUnavailableException(
          'No hay saldo disponible en OpenAI. Agrega créditos en Billing para habilitar el análisis.',
        );
      }
      if (
        [
          'project_spend_limit_exceeded',
          'organization_spend_limit_exceeded',
          'organization_usage_limit_exceeded',
          'usage_limit_exceeded',
        ].includes(String(code))
      ) {
        throw new ServiceUnavailableException(
          'Se alcanzó un límite de gasto o uso en OpenAI. Revisa los límites de tu proyecto y organización.',
        );
      }
      if (code === 'insufficient_quota' || type === 'insufficient_quota') {
        throw new ServiceUnavailableException(
          'La cuota de OpenAI está agotada. Revisa el saldo y los límites de facturación de tu proyecto.',
        );
      }
      throw new ServiceUnavailableException(
        'OpenAI limitó temporalmente las solicitudes. Espera un momento antes de intentar nuevamente.',
      );
    }
    if (response.status === 404 && code === 'model_not_found') {
      throw new ServiceUnavailableException(
        'El modelo configurado no existe o no está disponible para tu proyecto. Revisa OPENAI_SCAN_MODEL.',
      );
    }
    throw new BadGatewayException('OpenAI no pudo completar el análisis.');
  }

  private parseResponse(payload: unknown): AnalyzeModelOutputDto {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('status' in payload) ||
      payload.status !== 'completed' ||
      !('output' in payload) ||
      !Array.isArray(payload.output)
    ) {
      throw new BadGatewayException(
        'El proveedor devolvió un análisis incompleto.',
      );
    }
    const content: unknown[] = payload.output.flatMap((item: unknown) =>
      item &&
      typeof item === 'object' &&
      'type' in item &&
      item.type === 'message' &&
      'content' in item &&
      Array.isArray(item.content)
        ? item.content
        : [],
    );
    if (
      content.some(
        (item) =>
          item &&
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'refusal',
      )
    ) {
      throw new UnprocessableEntityException(
        'No se pudo analizar esta foto. Intenta con otra imagen de los plásticos.',
      );
    }
    const textParts = content.filter(
      (item): item is { type: string; text: string } =>
        !!item &&
        typeof item === 'object' &&
        'type' in item &&
        item.type === 'output_text' &&
        'text' in item &&
        typeof item.text === 'string',
    );
    if (textParts.length !== 1)
      throw new BadGatewayException(
        'El proveedor no devolvió un análisis estructurado.',
      );
    const parsed: unknown = JSON.parse(textParts[0].text);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !ANALYZE_JSON_SCHEMA.required.every((key) => Object.hasOwn(parsed, key))
    ) {
      throw new BadGatewayException(
        'El proveedor devolvió un análisis con campos faltantes.',
      );
    }
    const result = plainToInstance(AnalyzeModelOutputDto, parsed);
    if (
      validateSync(result, { whitelist: true, forbidNonWhitelisted: true })
        .length
    ) {
      throw new BadGatewayException(
        'El proveedor devolvió un análisis que no cumple el formato esperado.',
      );
    }
    return result;
  }
}
