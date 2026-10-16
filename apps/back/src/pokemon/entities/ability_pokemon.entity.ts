import { Exclude, Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('ability_pokemon')
export class AbilityPokemon {
  @ObjectIdColumn()
  @Exclude()
  _id: ObjectId;

  @Expose()
  get id(): string {
    return this._id?.toHexString();
  }

  @Column()
  name: string;

  @Column()
  pokemon_relation: string;

  @Column()
  isHidden: boolean;

  @Column()
  abilityId: ObjectId;

  @Column()
  pokemonId: ObjectId;
}
