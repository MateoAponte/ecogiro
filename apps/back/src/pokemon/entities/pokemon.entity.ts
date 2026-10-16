import { Exclude, Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('pokemon')
export class Pokemon {
  @ObjectIdColumn()
  @Exclude()
  _id: ObjectId;

  @Expose()
  get id(): string {
    return this._id?.toHexString();
  }

  @Column()
  abilities: string[];

  @Column()
  height: number;

  @Column()
  name: string;

  @Column()
  pokemonId: number;

  @Column()
  sprites: {
    front_static: string;
    animated: string;
  };

  @Column()
  stats: string;

  @Column()
  types: string[];

  @Column()
  moves: string[];

  @Column()
  weight: number;
}
