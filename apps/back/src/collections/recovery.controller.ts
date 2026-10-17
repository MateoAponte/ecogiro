import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import type { IAuthRequest } from '../auth/interfaces/IAuthRequest';
import { AccessValidator } from 'src/user/decorators/accessValidator.decorator';
import { CreateRecoveryDto } from './dto/create-recovery.dto';
import { UpdateRecoveryDto } from './dto/udpate-recovery.dto';
import { RecoveryResponseDto } from './dto/recovery-response.dto';
import { RecoveryService } from './provider/recovery.service';
import { Rol } from 'src/user/enums';
import { PaginationDto } from './dto/pagination.dto';
import { FindRecoveriesByUserDto } from './dto/find-recoveries-by-user.dto';

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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List recoveries for a user with pagination and filters',
  })
  @ApiOkResponse({ type: RecoveryResponseDto, isArray: true })
  findAllByUserId(
    @Query() query: FindRecoveriesByUserDto,
    @Req() request: IAuthRequest,
  ): Promise<RecoveryResponseDto[]> {
    const { user_id, ...pagination } = query;
    const role = request.user?.rol;
    if (
      ![Rol.ADMIN, Rol.USER, Rol.RECOVERY].includes(role as Rol) ||
      (role !== Rol.ADMIN && user_id !== request.user?.id)
    ) {
      throw new ForbiddenException('You can only list your own recoveries');
    }
    return this.recoveryService.findAllByUserId(
      user_id,
      pagination,
      role === Rol.RECOVERY,
    );
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all recoveries with pagination and filters' })
  @ApiOkResponse({ type: RecoveryResponseDto, isArray: true })
  findAll(
    @Query() pagination: PaginationDto,
    @Req() request: IAuthRequest,
  ): Promise<RecoveryResponseDto[]> {
    if (request.user?.rol !== Rol.RECOVERY && request.user?.rol !== Rol.ADMIN) {
      throw new ForbiddenException(
        'Only recovery agents or administrators can list all recoveries',
      );
    }
    return this.recoveryService.findAll(pagination);
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

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Accept an available recovery as the authenticated recovery agent',
  })
  @ApiOkResponse({ type: RecoveryResponseDto })
  acceptRecovery(
    @Param('id', recoveryIdPipe) id: string,
    @Req() request: IAuthRequest,
  ): Promise<RecoveryResponseDto> {
    const agentId = request.user?.id;
    const agentRole = request.user?.rol;
    if (typeof agentId !== 'number' || agentRole === undefined) {
      throw new UnauthorizedException('Invalid user');
    }
    // The service checks Rol.RECOVERY. Identity and role never come from the body.
    return this.recoveryService.acceptRecovery(id, agentId, agentRole);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  removeRecovery(@Param('id', recoveryIdPipe) id: string): Promise<void> {
    return this.recoveryService.removeRecovery(id);
  }
}
