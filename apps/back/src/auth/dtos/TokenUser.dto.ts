import { TokenDto } from './Encrypt.dto';
import { IntersectionType, PartialType } from '@nestjs/swagger';
import { User } from 'src/user/user.entity';

export class TokenUserDto extends PartialType(
  IntersectionType(TokenDto, User),
) {
  user?: User;
}
