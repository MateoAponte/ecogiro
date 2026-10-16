import { PartialType } from '@nestjs/swagger';
import { CreateMedailDto } from './create-medail.dto';

export class UpdateMedailDto extends PartialType(CreateMedailDto, {
  skipNullProperties: false,
}) {}
