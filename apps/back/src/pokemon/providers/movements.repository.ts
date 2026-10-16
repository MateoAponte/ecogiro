import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Movement } from '../entities/movements.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MovementsRepository {
  constructor(
    /**
     * Inject the pokemon repository
     * @param pokemonService - Inject the pokemonService
     */
    @InjectRepository(Movement)
    private readonly repo: MongoRepository<Movement>,
  ) {}

  findByName(name: string): Promise<Movement | null> {
    return this.repo.findOne({
      where: { name: name },
    });
  }
}
