import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Recovery } from '../recovery.entity';
import {
  Between,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateRecoveryDto } from '../dto/create-recovery.dto';
import { UpdateRecoveryDto } from '../dto/udpate-recovery.dto';
import { Status } from '../enums/Status.enum';
import { PaginationDto } from '../dto/pagination.dto';

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

  findAllByUserId(
    user_id: number,
    pagination: PaginationDto = {},
    byAgent = false,
  ): Promise<Recovery[]> {
    return this.findWithFilters(pagination, user_id, byAgent);
  }

  findAll(pagination: PaginationDto = {}): Promise<Recovery[]> {
    return this.findWithFilters(pagination);
  }

  private findWithFilters(
    pagination: PaginationDto,
    userId?: number,
    byAgent = false,
  ): Promise<Recovery[]> {
    const { dateFrom, dateTo, status, page = 1, limit = 20 } = pagination;
    const where: FindOptionsWhere<Recovery> = {};
    if (userId !== undefined) {
      if (byAgent) where.agent_id = userId;
      else where.user_id = userId;
    }
    if (status !== undefined) where.status = status;
    if (pagination.available) {
      where.agent_id = IsNull();
      where.status = status ?? In([Status.CREATED, Status.PENDING]);
    }
    if (dateFrom && dateTo) where.scheduled_date = Between(dateFrom, dateTo);
    else if (dateFrom) where.scheduled_date = MoreThanOrEqual(dateFrom);
    else if (dateTo) where.scheduled_date = LessThanOrEqual(dateTo);

    return this.repository.find({
      where,
      loadRelationIds: { relations: ['user_id'] },
      order: { scheduled_date: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
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

  async completeAssigned(id: string, agentId: number): Promise<boolean> {
    const result = await this.repository.update(
      { id, agent_id: agentId, status: Status.ASSIGNED },
      { status: Status.COMPLETED },
    );
    return result.affected === 1;
  }

  async cancelAssigned(id: string, agentId: number): Promise<boolean> {
    const result = await this.repository.update(
      { id, agent_id: agentId, status: Status.ASSIGNED },
      { status: Status.CANCELED },
    );
    return result.affected === 1;
  }
  async removeUnassigned(id: string, status: Status): Promise<boolean> {
    const result = await this.repository.delete({ id, status });
    return result.affected === 1;
  }
}
