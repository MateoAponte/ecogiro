import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medail } from '../medail.entity';
import { CreateMedailDto } from '../dto/create-medail.dto';
@Injectable()
export class MedailRepository {
  constructor(
    @InjectRepository(Medail) private readonly repository: Repository<Medail>,
  ) {}
  create(dto: CreateMedailDto): Promise<Medail> {
    return this.repository.save(this.repository.create(dto));
  }
  findAll(): Promise<Medail[]> {
    return this.repository.find({ order: { name: 'ASC', id: 'ASC' } });
  }
  findById(id: string): Promise<Medail | null> {
    return this.repository.findOneBy({ id });
  }
  save(entity: Medail): Promise<Medail> {
    return this.repository.save(entity);
  }
  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
