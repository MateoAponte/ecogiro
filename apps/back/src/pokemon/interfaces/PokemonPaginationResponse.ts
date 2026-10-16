import { Pokemon } from '../entities/pokemon.entity';

export class PokemonPaginationResponse {
  total: number;
  next_page: number;
  previous_page: number;
  pokemons: Pokemon[];
}
