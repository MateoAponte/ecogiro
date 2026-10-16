import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './provider/user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';
import { Rol } from './enums';
import {
  CreateUserDocumentation,
  DeleteUserDocumentation,
  GetAllUsersDocumentation,
  GetUserDocumentation,
  UpdateUserDocumentation,
} from './decorators/userDocumentation.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AccessValidator } from './decorators/accessValidator.decorator';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';

@ApiBearerAuth()
@ApiTags('users')
@UseGuards(RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @CreateUserDocumentation()
  // @AccessValidator()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @GetAllUsersDocumentation()
  @AccessValidator({
    roles: [Rol.USER],
  })
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @GetUserDocumentation()
  @AccessValidator({
    roles: [Rol.USER],
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @UpdateUserDocumentation()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<string> {
    return this.userService.update(id, updateUserDto);
  }

  @DeleteUserDocumentation()
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<DeleteResult> {
    return this.userService.remove(id);
  }
}
