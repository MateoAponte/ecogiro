import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MinLength(3)
  @MaxLength(100)
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(100)
  @IsNotEmpty()
  password: string;
}
