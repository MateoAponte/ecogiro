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
import { CreateMedailDto } from './dto/create-medail.dto';
import { UpdateMedailDto } from './dto/update-medail.dto';
import { MedailResponseDto } from './dto/medail-response.dto';
import { MedailService } from './provider/medail.service';

const idPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new BadRequestException('Not valid ID'),
});

@Controller('medails')
@ApiBearerAuth()
@ApiTags('medails')
@UseGuards(RolesGuard)
export class MedailController {
  constructor(private readonly service: MedailService) {}

  @Post()
  create(@Body() dto: CreateMedailDto): Promise<MedailResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<MedailResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', idPipe) id: string): Promise<MedailResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', idPipe) id: string,
    @Body() dto: UpdateMedailDto,
  ): Promise<MedailResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', idPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
