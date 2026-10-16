import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserMedailService } from './user-medail.service';
import { MedailCondition } from '../enums/medail-condition.enum';
import { User } from '../../user/user.entity';
import { Recovery } from '../../collections/recovery.entity';
import { Status } from '../../collections/enums/Status.enum';
import { Reward } from '../../rewards/reward.entity';
import { Medail } from '../medail.entity';
import { UserMedail } from '../user-medail.entity';
import { CreateRewardDto } from '../../rewards/dto/create-reward.dto';
import { UpdateRewardDto } from '../../rewards/dto/update-reward.dto';
import { CreateMedailDto } from '../dto/create-medail.dto';
import { UpdateMedailDto } from '../dto/update-medail.dto';
import { UpdateRecoveryDto } from '../../collections/dto/udpate-recovery.dto';

describe('Medail evaluation', () => {
  const pointsMedail = {
    id: 'required_points',
    condition_type: MedailCondition.ECO_POINTS,
    condition_value: 500,
  };
  const recoveryMedail = {
    id: 'recoveries',
    condition_type: MedailCondition.COMPLETED_RECOVERIES,
    condition_value: 2,
  };
  const users = { findOneBy: jest.fn() };
  const medails = { find: jest.fn() };
  const assignments = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const recoveries = { createQueryBuilder: jest.fn() };
  const countQuery = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const insert = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  let service: UserMedailService;
  beforeEach(() => {
    jest.clearAllMocks();
    users.findOneBy.mockResolvedValue({ id: 5, eco_points: 500 });
    medails.find.mockResolvedValue([pointsMedail, recoveryMedail]);
    recoveries.createQueryBuilder.mockReturnValue(countQuery);
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '2',
      recycled_kg: '12.5',
    });
    assignments.createQueryBuilder.mockReturnValue(insert);
    assignments.find.mockResolvedValue([]);
    service = new UserMedailService(
      users as unknown as Repository<User>,
      recoveries as unknown as Repository<Recovery>,
      medails as unknown as Repository<Medail>,
      assignments as unknown as Repository<UserMedail>,
    );
  });

  it('awards both conditions at the exact threshold', async () => {
    await service.evaluate(5);
    expect(insert.values).toHaveBeenCalledWith([
      { user_id: 5, medail_id: 'required_points' },
      { user_id: 5, medail_id: 'recoveries' },
    ]);
  });
  it('does not award unmet conditions', async () => {
    users.findOneBy.mockResolvedValue({ id: 5, eco_points: 499 });
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '1',
      recycled_kg: '0',
    });
    await service.evaluate(5);
    expect(insert.execute).not.toHaveBeenCalled();
  });
  it('awards a recycled-kg medail at the exact threshold', async () => {
    medails.find.mockResolvedValue([
      {
        id: 'kg',
        condition_type: MedailCondition.RECYCLED_KG,
        condition_value: 25,
      },
    ]);
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '3',
      recycled_kg: '25.000',
    });
    await service.evaluate(5);
    expect(insert.values).toHaveBeenCalledWith([
      { user_id: 5, medail_id: 'kg' },
    ]);
  });
  it('does not award a recycled-kg medail below the threshold', async () => {
    medails.find.mockResolvedValue([
      {
        id: 'kg',
        condition_type: MedailCondition.RECYCLED_KG,
        condition_value: 25,
      },
    ]);
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '3',
      recycled_kg: '24.999',
    });
    await service.evaluate(5);
    expect(insert.execute).not.toHaveBeenCalled();
  });
  it('returns numeric recycling totals from PostgreSQL aggregates', async () => {
    expect(await service.getStats(5)).toEqual({
      user_id: 5,
      completed_recoveries: 2,
      recycled_kg: 12.5,
    });
    expect(countQuery.addSelect).toHaveBeenCalledWith(
      'COALESCE(SUM(recovery.recycled_kg), 0)',
      'recycled_kg',
    );
  });
  it('returns zero totals when the user has no completed recoveries', async () => {
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '0',
      recycled_kg: '0',
    });
    expect(await service.getStats(5)).toEqual({
      user_id: 5,
      completed_recoveries: 0,
      recycled_kg: 0,
    });
  });
  it('returns 404 for statistics of a missing user', async () => {
    users.findOneBy.mockResolvedValue(null);
    await expect(service.getStats(99)).rejects.toThrow(NotFoundException);
  });
  it('counts only completed recoveries of the requested user', async () => {
    await service.evaluate(5);
    expect(countQuery.innerJoin).toHaveBeenCalledWith(
      'recovery.user_id',
      'owner',
    );
    expect(countQuery.where).toHaveBeenCalledWith('owner.id = :user_id', {
      user_id: 5,
    });
    expect(countQuery.andWhere).toHaveBeenCalledWith(
      'recovery.status = :status',
      { status: Status.COMPLETED },
    );
  });
  it('uses the unique assignment pair to ignore repeated or concurrent awards', async () => {
    await service.evaluate(5);
    await service.evaluate(5);
    expect(insert.onConflict).toHaveBeenCalledWith(
      '("user_id", "medail_id") DO NOTHING',
    );
  });
  it('returns 404 for a nonexistent user', async () => {
    users.findOneBy.mockResolvedValue(null);
    await expect(service.evaluate(99)).rejects.toThrow(NotFoundException);
    expect(insert.execute).not.toHaveBeenCalled();
  });
  it('picks up newly added catalog definitions on the next lookup', async () => {
    medails.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([pointsMedail]);
    await service.findByUser(5);
    expect(insert.execute).not.toHaveBeenCalled();
    await service.findByUser(5);
    expect(insert.values).toHaveBeenCalledWith([
      { user_id: 5, medail_id: 'required_points' },
    ]);
  });
  it('keeps already earned medails even when a threshold is no longer met', async () => {
    users.findOneBy.mockResolvedValue({ id: 5, eco_points: 0 });
    countQuery.getRawOne.mockResolvedValue({
      completed_recoveries: '0',
      recycled_kg: '0',
    });
    const medail = {
      ...pointsMedail,
      name: 'Logro',
      description: 'Descripción',
    };
    const earned_at = new Date();
    assignments.find.mockResolvedValue([
      {
        id: 'award',
        user_id: 5,
        medail_id: 'required_points',
        earned_at,
        medail,
      },
    ]);
    const result = await service.findByUser(5);
    expect(result[0]).toMatchObject({
      medail_id: 'required_points',
      earned_at,
      medail,
    });
    expect(assignments.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 5 } }),
    );
    expect(insert.execute).not.toHaveBeenCalled();
  });
});

describe('Catalog DTO validation', () => {
  const base = { name: 'Logro', description: 'Descripción' };
  it('accepts the new recycled-kg condition', async () => {
    expect(
      await validate(
        plainToInstance(CreateMedailDto, {
          ...base,
          condition_type: MedailCondition.RECYCLED_KG,
          condition_value: 25,
        }),
      ),
    ).toHaveLength(0);
  });
  it('allows updating just the measured weight and status', async () => {
    expect(
      await validate(
        plainToInstance(UpdateRecoveryDto, {
          recycled_kg: 12.345,
          status: Status.COMPLETED,
        }),
      ),
    ).toHaveLength(0);
    expect(await validate(plainToInstance(UpdateRecoveryDto, {}))).toHaveLength(
      0,
    );
    for (const recycled_kg of [
      null,
      -1,
      0.0001,
      '12.5',
      Infinity,
      NaN,
      1000000000,
    ]) {
      expect(
        (await validate(plainToInstance(UpdateRecoveryDto, { recycled_kg })))
          .length,
      ).toBeGreaterThan(0);
    }
  });
  it('accepts rewards without an owner and requires nonnegative integer required_points', async () => {
    expect(
      await validate(
        plainToInstance(CreateRewardDto, { ...base, required_points: 0 }),
      ),
    ).toHaveLength(0);
    for (const required_points of [undefined, null, -1, 1.5, '500']) {
      expect(
        (
          await validate(
            plainToInstance(CreateRewardDto, { ...base, required_points }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
  it('rejects unknown conditions and invalid thresholds', async () => {
    for (const condition_type of ['UNKNOWN', null, undefined]) {
      expect(
        (
          await validate(
            plainToInstance(CreateMedailDto, {
              ...base,
              condition_type,
              condition_value: 1,
            }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
    for (const condition_value of [0, -1, null, 1.5]) {
      expect(
        (
          await validate(
            plainToInstance(CreateMedailDto, {
              ...base,
              condition_type: MedailCondition.ECO_POINTS,
              condition_value,
            }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
  it('allows partial updates but rejects explicit nulls', async () => {
    expect(await validate(new UpdateRewardDto())).toHaveLength(0);
    expect(await validate(new UpdateMedailDto())).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(UpdateMedailDto, { condition_type: null }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe('TypeORM catalog metadata', () => {
  it('builds all relations, the unique award pair and PostgreSQL column types without a database connection', async () => {
    const source = new DataSource({
      type: 'postgres',
      entities: [User, Recovery, Reward, Medail, UserMedail],
    });
    await (
      source as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
    expect(source.getMetadata(Reward).relations).toHaveLength(0);
    expect(
      source.getMetadata(Reward).findColumnWithPropertyName('required_points')
        ?.type,
    ).toBe('int');
    const assignment = source.getMetadata(UserMedail);
    expect(
      assignment.uniques.some(
        (constraint) =>
          constraint.columns.map((column) => column.propertyName).join(',') ===
          'user_id,medail_id',
      ),
    ).toBe(true);
    expect(assignment.relations.map((relation) => relation.onDelete)).toEqual([
      'CASCADE',
      'CASCADE',
    ]);
    expect(
      source
        .getMetadata(User)
        .relations.find((relation) => relation.propertyName === 'medails')
        ?.inverseEntityMetadata.target,
    ).toBe(UserMedail);
  });
});
