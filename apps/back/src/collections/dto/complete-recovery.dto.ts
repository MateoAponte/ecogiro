import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteRecoveryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  verification_token!: string;
}
