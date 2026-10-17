import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RecoveryRepository } from './recovery.repository.service';
import { CreateRecoveryDto } from '../dto/create-recovery.dto';
import { RecoveryResponseDto } from '../dto/recovery-response.dto';
import { UpdateRecoveryDto } from '../dto/udpate-recovery.dto';
import { Status } from '../enums/Status.enum';
import { Rol } from '../../user/enums/Rol';
import { RecoveryEventsService } from '../events/recovery-events.service';
import { RecoveryAcceptedEvent } from '../events/recovery-accepted.event';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class RecoveryService {
  constructor(
    /**
     * Inject Recovery Repository
     */
    private readonly recoveryRepository: RecoveryRepository,
    private readonly recoveryEvents: RecoveryEventsService,
  ) {}

  async create(
    createRecoveryDto: CreateRecoveryDto,
  ): Promise<RecoveryResponseDto> {
    const recovery = await this.recoveryRepository.create(createRecoveryDto);

    return RecoveryResponseDto.fromEntity(recovery);
  }

  async findAllByUserId(
    user_id: number,
    pagination: PaginationDto = {},
  ): Promise<RecoveryResponseDto[]> {
    this.validatePagination(pagination);
    const recoveries = await this.recoveryRepository.findAllByUserId(
      user_id,
      pagination,
    );
    return recoveries.map((recovery) =>
      RecoveryResponseDto.fromEntity(recovery),
    );
  }

  async findAll(
    pagination: PaginationDto = {},
  ): Promise<RecoveryResponseDto[]> {
    this.validatePagination(pagination);
    const recoveries = await this.recoveryRepository.findAll(pagination);
    return recoveries.map((recovery) =>
      RecoveryResponseDto.fromEntity(recovery),
    );
  }

  private validatePagination(pagination: PaginationDto): void {
    if (
      pagination.dateFrom &&
      pagination.dateTo &&
      pagination.dateFrom > pagination.dateTo
    ) {
      throw new BadRequestException(
        'dateFrom must be less than or equal to dateTo',
      );
    }
    if (
      !Number.isSafeInteger(
        ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
      )
    ) {
      throw new BadRequestException('Pagination offset is too large');
    }
  }

  async findByRecoveryId(id: string): Promise<RecoveryResponseDto> {
    const recovery = await this.recoveryRepository.findByRecoveryId(id);
    if (!!recovery === false) {
      throw new NotFoundException('Recovery not found');
    }
    return RecoveryResponseDto.fromEntity(recovery);
  }

  // agentId and agentRole must come from the authenticated user, never the body.
  async acceptRecovery(
    id: string,
    agentId: number,
    agentRole: Rol,
  ): Promise<RecoveryResponseDto> {
    if (!Number.isSafeInteger(agentId) || agentId <= 0) {
      throw new UnauthorizedException('Invalid user');
    }
    if (agentRole !== Rol.RECOVERY) {
      throw new ForbiddenException(
        'Only recovery agents can accept recoveries',
      );
    }

    const recovery = await this.recoveryRepository.findByRecoveryId(id);
    if (!recovery) throw new NotFoundException('Recovery not found');
    if (recovery.user_id === agentId) {
      throw new ForbiddenException('You cannot accept your own recovery');
    }

    // Retrying a successful acceptance makes no new change or event.
    if (recovery.status === Status.ASSIGNED && recovery.agent_id === agentId) {
      return RecoveryResponseDto.fromEntity(recovery);
    }
    if (
      recovery.agent_id !== null ||
      ![Status.CREATED, Status.PENDING].includes(recovery.status)
    ) {
      throw new ConflictException('Recovery is no longer available');
    }

    const accepted = await this.recoveryRepository.accept(id, agentId);
    if (!accepted) {
      throw new ConflictException('Recovery is no longer available');
    }

    // The conditional UPDATE has succeeded. Reflect those changes without a
    // second read that could race with a later cancellation or deletion.
    recovery.agent_id = agentId;
    recovery.status = Status.ASSIGNED;
    this.recoveryEvents.publishAccepted(
      new RecoveryAcceptedEvent(recovery.id, recovery.user_id, agentId),
    );
    return RecoveryResponseDto.fromEntity(recovery);
  }

  async updateRecovery(
    id: string,
    updateRecoveryDto: UpdateRecoveryDto,
  ): Promise<RecoveryResponseDto> {
    const recovery = await this.recoveryRepository.findByRecoveryId(id);
    console.log(recovery);

    if (!!recovery === false) {
      throw new NotFoundException('Recovery not found');
    }
    const updatedRecovery = await this.recoveryRepository.update(
      id,
      updateRecoveryDto,
    );
    return RecoveryResponseDto.fromEntity(updatedRecovery);
  }

  async removeRecovery(id: string): Promise<void> {
    const recovery = await this.recoveryRepository.findByRecoveryId(id);
    if (!!recovery === false) {
      throw new NotFoundException('Recovery not found');
    }
    await this.recoveryRepository.remove(id);
  }
}
