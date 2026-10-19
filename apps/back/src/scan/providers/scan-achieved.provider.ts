import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Recovery } from '../../collections/recovery.entity';
import { Status } from '../../collections/enums/Status.enum';
import { Rol } from '../../user/enums/Rol';
import { ScanAnalyzerProvider } from './scan-analyzer.provider';
import { ScanImageFile } from '../pipes/scan-image.pipe';
import { ACHIEVED_SYSTEM_PROMPT } from '../prompts/achieved.prompt';

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['is_valid', 'reason_invalid', 'materials'],
  properties: {
    is_valid: { type: 'boolean' },
    reason_invalid: { type: ['string', 'null'] },
    materials: { type: 'array', maxItems: 5, items: { type: 'string' } },
  },
};

@Injectable()
export class ScanAchievedProvider {
  // Receipts expire after ten minutes and are invalidated by a backend restart.
  private readonly key = randomBytes(32);
  constructor(
    private readonly analyzer: ScanAnalyzerProvider,
    @InjectRepository(Recovery)
    private readonly recoveries: Repository<Recovery>,
  ) {}

  async achieved(
    image: ScanImageFile,
    recoveryId: string,
    agentId: number,
    role: Rol,
  ) {
    if (role !== Rol.RECOVERY)
      throw new ForbiddenException('Only agents can verify collections');
    const recovery = await this.recoveries.findOneBy({ id: recoveryId });
    if (!recovery) throw new NotFoundException('Recovery not found');
    if (recovery.agent_id !== agentId)
      throw new ForbiddenException('Recovery is not assigned to you');
    if (recovery.status !== Status.ASSIGNED)
      throw new ConflictException('Recovery is not accepted');
    const result = await this.analyzer.generate(
      image,
      ACHIEVED_SYSTEM_PROMPT,
      `Verifica los materiales de esta recolección. Contexto: ${JSON.stringify(recovery.description)}`,
      schema,
      (value) => {
        const data = value as {
          is_valid?: unknown;
          reason_invalid?: unknown;
          materials?: unknown;
        } | null;
        if (
          !data ||
          typeof data.is_valid !== 'boolean' ||
          !(
            data.reason_invalid === null ||
            (typeof data.reason_invalid === 'string' &&
              data.reason_invalid.trim().length > 0 &&
              data.reason_invalid.length <= 500)
          ) ||
          !Array.isArray(data.materials) ||
          data.materials.length > 5 ||
          !data.materials.every(
            (item: unknown) =>
              typeof item === 'string' &&
              item.trim().length > 0 &&
              item.length <= 100,
          ) ||
          (data.is_valid &&
            (data.reason_invalid !== null || !data.materials.length)) ||
          (!data.is_valid &&
            (data.reason_invalid === null || data.materials.length > 0))
        ) {
          throw new BadGatewayException('Invalid Achieved response');
        }
        return {
          is_valid: data.is_valid,
          reason_invalid: data.reason_invalid,
          materials: data.materials as string[],
        };
      },
    );
    if (!result.is_valid)
      throw new UnprocessableEntityException(result.reason_invalid);
    const payload = Buffer.from(
      JSON.stringify({ recoveryId, agentId, expires: Date.now() + 600000 }),
    ).toString('base64url');
    const signature = createHmac('sha256', this.key)
      .update(payload)
      .digest('base64url');
    return { ...result, verification_token: `${payload}.${signature}` };
  }

  validateReceipt(token: string, recoveryId: string, agentId: number): void {
    try {
      const [payload, signature, extra] = token.split('.');
      if (!payload || !signature || extra) throw new Error();
      const expected = createHmac('sha256', this.key).update(payload).digest();
      const actual = Buffer.from(signature, 'base64url');
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
      )
        throw new Error();
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
        recoveryId: string;
        agentId: number;
        expires: number;
      };
      if (
        data.recoveryId !== recoveryId ||
        data.agentId !== agentId ||
        typeof data.expires !== 'number' ||
        data.expires <= Date.now()
      )
        throw new Error();
    } catch {
      throw new UnprocessableEntityException(
        'La verificación expiró o no es válida. Toma otra foto.',
      );
    }
  }
}
