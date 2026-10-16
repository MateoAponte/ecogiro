import { Pokemon } from '../entities/pokemon.entity';
import { Ability } from '../entities/ability.entity';
import { Type } from '../entities/types.entity';

export class PokemonDetail {
  pokemon: Omit<Pokemon, 'abilities' | 'types' | '_id'> & {
    abilities: Ability[];
    types: Type[];
  };
}
