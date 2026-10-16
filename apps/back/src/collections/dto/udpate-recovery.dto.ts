import { PartialType } from '@nestjs/swagger';
import { CreateRecoveryDto } from './create-recovery.dto';

export class UpdateRecoveryDto extends PartialType(CreateRecoveryDto, {
  skipNullProperties: false,
}) {}
