import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Recovery } from '../recovery.entity';
import { In, IsNull, Repository } from 'typeorm';
import { CreateRecoveryDto } from '../dto/create-recovery.dto';
import { UpdateRecoveryDto } from '../dto/udpate-recovery.dto';
import { Status } from '../enums/Status.enum';

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

  async accept(id: string, agentId: number): Promise<boolean> {
    // Check availability and assign in one SQL statement. Concurrent attempts
    // cannot both match the same unassigned recovery after one has accepted it.
    const result = await this.repository.update(
      {
        id,
        agent_id: IsNull(),
        status: In([Status.CREATED, Status.PENDING]),
      },
      {
        agent_id: agentId,
        status: Status.ASSIGNED,
      },
    );
    return result.affected === 1;
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
