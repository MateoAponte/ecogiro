import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardResponseDto } from './dto/reward-response.dto';
import { RewardService } from './provider/reward.service';

const idPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new BadRequestException('Not valid ID'),
});

@Controller('rewards')
@ApiBearerAuth()
@ApiTags('rewards')
@UseGuards(RolesGuard)
export class RewardController {
  constructor(private readonly service: RewardService) {}

  @Post()
  create(@Body() dto: CreateRewardDto): Promise<RewardResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<RewardResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', idPipe) id: string): Promise<RewardResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', idPipe) id: string,
    @Body() dto: UpdateRewardDto,
  ): Promise<RewardResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', idPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
