import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { Recovery } from '../../collections/recovery.entity';
import { Status } from '../../collections/enums/Status.enum';
import { Medail } from '../medail.entity';
import { UserMedail } from '../user-medail.entity';
import { MedailCondition } from '../enums/medail-condition.enum';
import { UserMedailResponseDto } from '../dto/user-medail-response.dto';
import { RecyclingStatsResponseDto } from '../dto/recycling-stats-response.dto';

@Injectable()
export class UserMedailService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Recovery)
    private readonly recoveries: Repository<Recovery>,
    @InjectRepository(Medail) private readonly medails: Repository<Medail>,
    @InjectRepository(UserMedail)
    private readonly assignments: Repository<UserMedail>,
  ) {}
  private async aggregateRecoveries(
    user_id: number,
  ): Promise<RecyclingStatsResponseDto> {
    const totals = await this.recoveries
      .createQueryBuilder('recovery')
      .innerJoin('recovery.user_id', 'owner')
      .where('owner.id = :user_id', { user_id })
      .andWhere('recovery.status = :status', { status: Status.COMPLETED })
      .select('COUNT(*)', 'completed_recoveries')
      .addSelect('COALESCE(SUM(recovery.recycled_kg), 0)', 'recycled_kg')
      .getRawOne<{ completed_recoveries: string; recycled_kg: string }>();

    return {
      user_id,
      completed_recoveries: Number(totals?.completed_recoveries ?? 0),
      recycled_kg: Number(totals?.recycled_kg ?? 0),
    };
  }

  async getStats(user_id: number): Promise<RecyclingStatsResponseDto> {
    if (!(await this.users.findOneBy({ id: user_id }))) {
      throw new NotFoundException('User not found');
    }
    return this.aggregateRecoveries(user_id);
  }

  async evaluate(user_id: number): Promise<void> {
    const user = await this.users.findOneBy({ id: user_id });
    if (!user) throw new NotFoundException('User not found');
    const [medails, stats] = await Promise.all([
      this.medails.find(),
      this.aggregateRecoveries(user_id),
    ]);
    const eligible = medails.filter((medail) => {
      switch (medail.condition_type) {
        case MedailCondition.ECO_POINTS:
          return user.eco_points >= medail.condition_value;
        case MedailCondition.COMPLETED_RECOVERIES:
          return stats.completed_recoveries >= medail.condition_value;
        case MedailCondition.RECYCLED_KG:
          return stats.recycled_kg >= medail.condition_value;
        default:
          return false;
      }
    });
    if (eligible.length) {
      // The unique pair and ON CONFLICT make repeated/concurrent evaluations safe.
      await this.assignments
        .createQueryBuilder()
        .insert()
        .into(UserMedail)
        .values(eligible.map((medail) => ({ user_id, medail_id: medail.id })))
        .onConflict('("user_id", "medail_id") DO NOTHING')
        .execute();
    }
  }
  async findByUser(user_id: number): Promise<UserMedailResponseDto[]> {
    // Also reconcile new catalog definitions and changes made by other processes.
    await this.evaluate(user_id);
    return (
      await this.assignments.find({
        where: { user_id },
        relations: { medail: true },
        order: { earned_at: 'ASC', id: 'ASC' },
      })
    ).map(UserMedailResponseDto.fromEntity);
  }
}
