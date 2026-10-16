import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards';
import { UserMedailService } from './provider/user-medail.service';
import { UserMedailResponseDto } from './dto/user-medail-response.dto';
import { RecyclingStatsResponseDto } from './dto/recycling-stats-response.dto';
@Controller('user/:user_id')
@ApiTags('user medails')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class UserMedailController {
  constructor(private readonly service: UserMedailService) {}
  private checkId(id: number): void {
    if (id < 1) throw new BadRequestException('Not valid user ID');
  }
  @Get('medails')
  findAll(
    @Param('user_id', ParseIntPipe) user_id: number,
  ): Promise<UserMedailResponseDto[]> {
    this.checkId(user_id);
    return this.service.findByUser(user_id);
  }
  @Post('medails/evaluate')
  evaluate(
    @Param('user_id', ParseIntPipe) user_id: number,
  ): Promise<UserMedailResponseDto[]> {
    this.checkId(user_id);
    return this.service.findByUser(user_id);
  }

  @Get('recycling-stats')
  getStats(
    @Param('user_id', ParseIntPipe) user_id: number,
  ): Promise<RecyclingStatsResponseDto> {
    this.checkId(user_id);
    return this.service.getStats(user_id);
  }
}
