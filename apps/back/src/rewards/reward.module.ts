import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './reward.entity';
import { RewardController } from './reward.controller';
import { RewardService } from './provider/reward.service';
import { RewardRepository } from './provider/reward.repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reward])],
  controllers: [RewardController],
  providers: [RewardService, RewardRepository],
})
export class RewardModule {}
