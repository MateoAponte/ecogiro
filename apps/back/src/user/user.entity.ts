import {
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './enums/Rol';
import { Exclude } from 'class-transformer';
import { Recovery } from 'src/collections/recovery.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: false })
  phone!: string;

  @Column({ nullable: false })
  address!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: Rol,
    default: Rol.USER,
    nullable: false,
  })
  rol!: Rol;

  @Exclude()
  @Column()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Recovery, (recovery) => recovery.user_id)
  recoveries!: Recovery[];

  @BeforeInsert()
  setDefaults(): void {
    if (this.rol === undefined) this.rol = Rol.USER;

    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }
}
