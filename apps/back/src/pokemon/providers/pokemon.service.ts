import { Injectable, NotFoundException } from '@nestjs/common';
import { PokemonRepository } from './pokemon.repository';
import { Pokemon } from '../entities/pokemon.entity';
import { AbilityRepository } from './ability.repository';
import { TypesRepository } from './types.repository';
import { PokemonDetail } from '../interfaces/PokemonDetail';
import { PokemonPaginationDto } from '../dtos/pokemon-pagination.dto';
import { PokemonPaginationResponse } from '../interfaces/PokemonPaginationResponse';
import { PokemonIdsDto } from '../dtos/pokemon-ids.dto';

@Injectable()
export class PokemonService {
  constructor(
    /**
     * Inject the pokemons repository
     */
    private readonly pokemonRepository: PokemonRepository,

    /**
     * Inject the pokemon abilities repository
     */
    private readonly abilityRepository: AbilityRepository,

    /**
     * Inject the pokemon types repository
     */
    private readonly typesRepository: TypesRepository,
  ) {}

  async findAll(
    pokemonPagination: PokemonPaginationDto,
  ): Promise<PokemonPaginationResponse> {
    const data = await this.pokemonRepository.findAll(pokemonPagination);

    return {
      total: data[1],
      next_page: pokemonPagination.page + 1,
      previous_page: pokemonPagination.page - 1,
      pokemons: data[0],
    };
  }

  async findById(id: string): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.findOne(id);
    if (pokemon === null)
      throw new NotFoundException(`Pokemon with id ${id} not found`);

    return pokemon;
  }

  async findPokemonDetail(id: string): Promise<PokemonDetail> {
    const pokemon = await this.pokemonRepository.findOne(id);
    if (!pokemon) throw new NotFoundException(`Pokemon not found`);

    const { _id, ...pokemonData } = pokemon;

    if (pokemonData === null)
      throw new NotFoundException(`Pokemon with id ${id} not found`);

    const pokemonAbilities = await this.abilityRepository.findRelationById(
      _id.toHexString(),
    );
    if (pokemonAbilities.length <= 0)
      throw new NotFoundException(`Ability with id ${id} not found`);

    const abilities = await Promise.all(
      pokemonAbilities.map(async (abilityPokemon) => {
        const ability = await this.abilityRepository.findAbilityById(
          abilityPokemon.abilityId.toHexString(),
        );
        if (!ability) throw new NotFoundException(`Ability not found`);
        const { _id, ...abilityData } = ability;
        if (_id === undefined) throw new NotFoundException(`Ability not found`);

        return {
          ...abilityData,
          id: _id.toHexString(),
          isHidden: abilityPokemon.isHidden,
        };
      }),
    );

    const types = await Promise.all(
      pokemon.types.map(async (movement) => {
        const type = await this.typesRepository.findByName(movement);
        if (!type) throw new NotFoundException(`Type ${movement} not found`);
        return type;
      }),
    );

    if (pokemonAbilities === null)
      throw new NotFoundException(`PokemonAbility with id ${id} not found`);

    return {
      pokemon: {
        ...pokemonData,
        id: pokemon.id,
        abilities,
        types,
      },
    };
  }

  async findAllById(
    body: PokemonIdsDto,
    pokemonPagination: PokemonPaginationDto,
  ): Promise<PokemonPaginationResponse> {
    const data = await this.pokemonRepository.findAllById(
      pokemonPagination,
      body,
    );
    return {
      total: data[1],
      next_page: pokemonPagination.page + 1,
      previous_page: pokemonPagination.page - 1,
      pokemons: data[0],
    };
  }
}
