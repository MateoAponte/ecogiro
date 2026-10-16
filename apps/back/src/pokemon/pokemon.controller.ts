import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PokemonService } from './providers/pokemon.service';
import { PokemonIdsDto } from './dtos/pokemon-ids.dto';
import { ApiTags } from '@nestjs/swagger';
import { PokemonDetail } from './interfaces/PokemonDetail';
import { ActivitiesGuard, JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { PokemonPaginationDto } from './dtos/pokemon-pagination.dto';
import { PokemonPaginationResponse } from './interfaces/PokemonPaginationResponse';

@ApiTags('pokemon')
// @UseGuards(JwtAuthGuard, RolesGuard, ActivitiesGuard)
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  findAll(
    @Query() pokemonPagination: PokemonPaginationDto,
  ): Promise<PokemonPaginationResponse> {
    return this.pokemonService.findAll(pokemonPagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PokemonDetail> {
    return this.pokemonService.findPokemonDetail(id);
  }

  @Post()
  findAllById(
    @Body() body: PokemonIdsDto,
    @Query() pokemonPagination: PokemonPaginationDto,
  ): Promise<PokemonPaginationResponse> {
    return this.pokemonService.findAllById(body, pokemonPagination);
  }
}
