import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Recovery } from '../recovery.entity';
import { Repository } from 'typeorm';
import { CreateRecoveryDto } from '../dto/create-recovery.dto';
import { UpdateRecoveryDto } from '../dto/udpate-recovery.dto';

@Injectable()
export class RecoveryRepository {
  constructor(
    /**
     * Inject DB Repository
     */
    @InjectRepository(Recovery)
    private readonly repository: Repository<Recovery>,
  ) {}

  async create(recovery: CreateRecoveryDto): Promise<Recovery> {
    return this.repository.save(recovery);
  }

  async findAllByUserId(user_id: number): Promise<Recovery[]> {
    return this.repository.find({
      where: { user_id },
      relations: ['user_id'],
      order: { scheduled_date: 'ASC' },
    });
  }

  async findByRecoveryId(id: string): Promise<Recovery | null> {
    return this.repository.findOne({
      where: { id },
      loadRelationIds: { relations: ['user_id'] },
    });
  }

  async update(
    id: string,
    updateRecoveryDto: UpdateRecoveryDto,
  ): Promise<Recovery> {
    const recovery = await this.repository.findOne({
      where: { id },
    });

    return this.repository.save({
      ...recovery,
      ...updateRecoveryDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
