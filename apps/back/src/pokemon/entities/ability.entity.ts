import { Exclude, Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('ability')
export class Ability {
  @ObjectIdColumn()
  @Exclude()
  _id?: ObjectId;

  @Expose()
  get id(): string {
    return this._id?.toHexString() ?? '';
  }

  @Column()
  text: string;

  @Column()
  pokemon: string[];

  @Column()
  abilityId: number;

  @Column()
  name: string;
}
