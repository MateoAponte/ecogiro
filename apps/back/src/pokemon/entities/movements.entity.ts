import { Exclude, Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('movements')
export class Movement {
  @ObjectIdColumn()
  @Exclude()
  _id: ObjectId;

  @Expose()
  get id(): string {
    return this._id?.toHexString();
  }

  @Column()
  movementId: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  power: number;

  @Column()
  pp: number;
}
