import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../reward.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
@Injectable()
export class RewardRepository {
  constructor(
    @InjectRepository(Reward) private readonly repository: Repository<Reward>,
  ) {}
  create(dto: CreateRewardDto): Promise<Reward> {
    return this.repository.save(this.repository.create(dto));
  }
  findAll(): Promise<Reward[]> {
    return this.repository.find({ order: { name: 'ASC', id: 'ASC' } });
  }
  findById(id: string): Promise<Reward | null> {
    return this.repository.findOneBy({ id });
  }
  save(entity: Reward): Promise<Reward> {
    return this.repository.save(entity);
  }
  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
