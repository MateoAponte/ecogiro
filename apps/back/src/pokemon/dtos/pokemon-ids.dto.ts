import { IsNumber, IsArray } from 'class-validator';

export class PokemonIdsDto {
  @IsArray()
  @IsNumber({ allowNaN: false }, { each: true })
  pokemon_ids: number[];
}
