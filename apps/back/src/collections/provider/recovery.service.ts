import { Injectable, NotFoundException } from '@nestjs/common';
import { RecoveryRepository } from './recovery.repository.service';
import { CreateRecoveryDto } from '../dto/create-recovery.dto';
import { RecoveryResponseDto } from '../dto/recovery-response.dto';
import { UpdateRecoveryDto } from '../dto/udpate-recovery.dto';

@Injectable()
export class RecoveryService {
  constructor(
    /**
     * Inject Recovery Repository
     */
    private readonly recoveryRepository: RecoveryRepository,
  ) {}

  async create(
    createRecoveryDto: CreateRecoveryDto,
  ): Promise<RecoveryResponseDto> {
    const recovery = await this.recoveryRepository.create(createRecoveryDto);

    return RecoveryResponseDto.fromEntity(recovery);
  }

  async findAllByUserId(user_id: number): Promise<RecoveryResponseDto[]> {
    const recoveries = await this.recoveryRepository.findAllByUserId(user_id);
    return recoveries.map((recovery) =>
      RecoveryResponseDto.fromEntity(recovery),
    );
  }

  async findByRecoveryId(id: string): Promise<RecoveryResponseDto> {
    const recovery = await this.recoveryRepository.findByRecoveryId(id);
    if (!!recovery === false) {
      throw new NotFoundException('Recovery not found');
    }
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
