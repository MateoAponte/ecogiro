import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { PokemonPaginationDto } from '../dtos/pokemon-pagination.dto';
import { PokemonIdsDto } from '../dtos/pokemon-ids.dto';

@Injectable()
export class PokemonRepository {
  constructor(
    /**
     * Inject the pokemon repository
     * @param repo - Inject the pokemonService
     */
    @InjectRepository(Pokemon)
    private readonly repo: MongoRepository<Pokemon>,
  ) {}

  private buildSearchFilter(
    pokemonPagination: PokemonPaginationDto,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (pokemonPagination.type) {
      filter.types = { $all: pokemonPagination.type };
    }

    if (pokemonPagination.filter) {
      const query = pokemonPagination.filter.trim();
      const id = Number(query);
      const isNumeric = Number.isInteger(id) && query !== '';

      if (isNumeric) {
        filter.$or = [
          { pokemonId: id },
          { name: { $regex: new RegExp(query, 'i') } },
        ];
      } else {
        filter.name = { $regex: new RegExp(query, 'i') };
      }
    }

    return filter;
  }

  async findAll(
    pokemonPagination: PokemonPaginationDto,
  ): Promise<[Pokemon[], number]> {
    return this.repo.findAndCount({
      select: ['name', 'pokemonId', 'sprites', 'types'],
      skip: (pokemonPagination.page - 1) * pokemonPagination.limit,
      take: pokemonPagination.limit,
      where: this.buildSearchFilter(pokemonPagination),
    });
  }

  async findRelationById(id: string): Promise<Pokemon | null> {
    return this.repo.findOne({
      where: {
        _id: new ObjectId(id),
      },
      select: ['name', 'pokemonId', '_id'],
    });
  }

  async findAllById(
    pokemonPagination: PokemonPaginationDto,
    body: PokemonIdsDto,
  ): Promise<[Pokemon[], number]> {
    const filter = this.buildSearchFilter(pokemonPagination);

    const byIds =
      body.pokemon_ids.length > 0
        ? { pokemonId: { $in: body.pokemon_ids } }
        : {};

    return this.repo.findAndCount({
      select: ['name', 'pokemonId', 'sprites', 'types'],
      skip: (pokemonPagination.page - 1) * pokemonPagination.limit,
      take: pokemonPagination.limit,
      where: { ...filter, ...byIds },
    });
  }

  async findOne(id: string): Promise<Pokemon | null> {
    return this.repo.findOne({ where: { _id: new ObjectId(id) } });
  }
}
