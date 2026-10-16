import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from '../entities/types.entity';
import { MongoRepository } from 'typeorm';

@Injectable()
export class TypesRepository {
  constructor(
    /**
     * Inject the pokemon repository
     * @param repo - Inject the Repository
     */
    @InjectRepository(Type)
    private readonly repo: MongoRepository<Type>,
  ) {}

  findByName(name: string): Promise<Type | null> {
    return this.repo.findOne({
      where: { name },
      select: ['sprite', 'typeId', 'name'],
    });
  }
}
