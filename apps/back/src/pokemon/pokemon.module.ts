import { Module } from '@nestjs/common';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './providers/pokemon.service';
import { PokemonRepository } from './providers/pokemon.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { MovementsRepository } from './providers/movements.repository';
import { TypesRepository } from './providers/types.repository';
import { AbilityRepository } from './providers/ability.repository';
import { Ability } from './entities/ability.entity';
import { Movement } from './entities/movements.entity';
import { Type } from './entities/types.entity';
import { AbilityPokemon } from './entities/ability_pokemon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pokemon,
      Ability,
      Movement,
      Type,
      AbilityPokemon,
    ]),
  ],
  controllers: [PokemonController],
  providers: [
    PokemonService,
    PokemonRepository,
    MovementsRepository,
    TypesRepository,
    AbilityRepository,
  ],
  exports: [PokemonRepository],
})
export class PokemonModule {}
