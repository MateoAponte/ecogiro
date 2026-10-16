import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('types')
export class Type {
  @ObjectIdColumn()
  @Exclude()
  _id: ObjectId;

  @Expose()
  get id(): string {
    return this._id?.toHexString();
  }

  @Column()
  sprite: string;

  @Column()
  typeId: number;

  @Column()
  name: string;
}
