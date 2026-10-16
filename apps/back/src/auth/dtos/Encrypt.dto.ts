import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  at_secret: string;

  @IsString()
  @IsNotEmpty()
  rt_secret: string;
}
