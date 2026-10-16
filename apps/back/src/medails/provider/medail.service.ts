import { Injectable, NotFoundException } from '@nestjs/common';
import { MedailRepository } from './medail.repository.service';
import { CreateMedailDto } from '../dto/create-medail.dto';
import { UpdateMedailDto } from '../dto/update-medail.dto';
import { MedailResponseDto } from '../dto/medail-response.dto';
import { Medail } from '../medail.entity';

@Injectable()
export class MedailService {
  constructor(private readonly repository: MedailRepository) {}
  private async getEntity(id: string): Promise<Medail> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Medail not found');
    return entity;
  }
  async create(dto: CreateMedailDto): Promise<MedailResponseDto> {
    return MedailResponseDto.fromEntity(await this.repository.create(dto));
  }
  async findAll(): Promise<MedailResponseDto[]> {
    return (await this.repository.findAll()).map(MedailResponseDto.fromEntity);
  }
  async findOne(id: string): Promise<MedailResponseDto> {
    return MedailResponseDto.fromEntity(await this.getEntity(id));
  }
  async update(id: string, dto: UpdateMedailDto): Promise<MedailResponseDto> {
    const entity = await this.getEntity(id);
    Object.assign(entity, dto);
    return MedailResponseDto.fromEntity(await this.repository.save(entity));
  }
  async remove(id: string): Promise<void> {
    await this.getEntity(id);
    await this.repository.remove(id);
  }
}
