import { Injectable } from '@nestjs/common';
import { Ability } from '../entities/ability.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { AbilityPokemon } from '../entities/ability_pokemon.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class AbilityRepository {
  constructor(
    /**
     * Inject the pokemon repository
     * @param repo - Inject the pokemonService
     */
    @InjectRepository(Ability)
    private readonly repoAbility: MongoRepository<Ability>,
    /**
     * Inject the pokemon repository
     * @param repo - Inject the pokemonService
     */
    @InjectRepository(AbilityPokemon)
    private readonly repoAbilityPokemon: MongoRepository<AbilityPokemon>,
  ) {}

  findAbilityById(id: string): Promise<Ability | null> {
    return this.repoAbility.findOne({
      where: { _id: new ObjectId(id) },
      select: ['text', 'name', 'abilityId'],
    });
  }

  findRelationById(
    pokemonId: string,
    abilityId?: string,
  ): Promise<AbilityPokemon[]> {
    return this.repoAbilityPokemon.find({
      where: {
        $or: [
          { pokemonId: new ObjectId(pokemonId) },
          { abilityId: new ObjectId(abilityId) },
        ],
      },
    });
  }
}
