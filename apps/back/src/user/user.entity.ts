import {
  BeforeInsert,
  Column,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './enums/Rol';
import { Activity } from './enums';
import { Exclude, Expose } from 'class-transformer';

@Entity()
export class User {
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
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  rol: Rol;

  @Column({})
  activities: Activity[];

  @Exclude()
  @Column()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  favorities: number[];

  @Column()
  team: number[];

  @BeforeInsert()
  setDefaults(): void {
    if (this.rol === undefined) this.rol = Rol.USER;
    if (this.activities === undefined) this.activities = [Activity.READER];

    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }
}
