import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './enums/Rol';
import { Activity } from './enums';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Rol,
    default: Rol.USER,
    nullable: false,
  })
  rol: Rol;

  @Column({
    type: 'enum',
    enum: Activity,
    array: true,
    default: [],
  })
  activities: Activity[];

  @Exclude()
  @Column()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setDefaults(): void {
    if (this.rol === undefined) this.rol = Rol.USER;
    if (this.activities === undefined) this.activities = [Activity.READER];

    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }
}
