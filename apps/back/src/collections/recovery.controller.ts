import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards';
import { AccessValidator } from 'src/user/decorators/accessValidator.decorator';
import { CreateRecoveryDto } from './dto/create-recovery.dto';
import { UpdateRecoveryDto } from './dto/udpate-recovery.dto';
import { RecoveryResponseDto } from './dto/recovery-response.dto';
import { RecoveryService } from './provider/recovery.service';
import { Rol } from 'src/user/enums';

const recoveryIdPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new BadRequestException('Not valid ID'),
});

@Controller('recovery')
@ApiBearerAuth()
@ApiTags('recoveries')
@UseGuards(RolesGuard)
export class RecoveryController {
  constructor(
    /**
     * Inject Recovery Service
     */
    private readonly recoveryService: RecoveryService,
  ) {}

  // @CreateUserDocumentation()
  // @AccessValidator({
  //   roles: [Rol.ADMIN, Rol.RECOVERY],
  // })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body() createRecoveryDto: CreateRecoveryDto,
  ): Promise<RecoveryResponseDto> {
    return this.recoveryService.create(createRecoveryDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAllByUserId(
    @Query('user_id', ParseIntPipe) user_id: number,
  ): Promise<RecoveryResponseDto[]> {
    return this.recoveryService.findAllByUserId(user_id);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findByRecoveryId(
    @Param('id', recoveryIdPipe) id: string,
  ): Promise<RecoveryResponseDto> {
    return this.recoveryService.findByRecoveryId(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  updateRecovery(
    @Param('id', recoveryIdPipe) id: string,
    @Body() updateRecoveryDto: UpdateRecoveryDto,
  ): Promise<RecoveryResponseDto> {
    return this.recoveryService.updateRecovery(id, updateRecoveryDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  removeRecovery(@Param('id', recoveryIdPipe) id: string): Promise<void> {
    return this.recoveryService.removeRecovery(id);
  }
}
