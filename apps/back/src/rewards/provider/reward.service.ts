import { Injectable, NotFoundException } from '@nestjs/common';
import { RewardRepository } from './reward.repository.service';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';
import { RewardResponseDto } from '../dto/reward-response.dto';
import { Reward } from '../reward.entity';

@Injectable()
export class RewardService {
  constructor(private readonly repository: RewardRepository) {}
  private async getEntity(id: string): Promise<Reward> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Reward not found');
    return entity;
  }
  async create(dto: CreateRewardDto): Promise<RewardResponseDto> {
    return RewardResponseDto.fromEntity(await this.repository.create(dto));
  }
  async findAll(): Promise<RewardResponseDto[]> {
    return (await this.repository.findAll()).map(RewardResponseDto.fromEntity);
  }
  async findOne(id: string): Promise<RewardResponseDto> {
    return RewardResponseDto.fromEntity(await this.getEntity(id));
  }
  async update(id: string, dto: UpdateRewardDto): Promise<RewardResponseDto> {
    const entity = await this.getEntity(id);
    Object.assign(entity, dto);
    return RewardResponseDto.fromEntity(await this.repository.save(entity));
  }
  async remove(id: string): Promise<void> {
    await this.getEntity(id);
    await this.repository.remove(id);
  }
}
