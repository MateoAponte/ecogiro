import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Medail } from './medail.entity';
@Entity()
@Unique('UQ_user_medail_user_medail', ['user_id', 'medail_id'])
export class UserMedail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'int' })
  user_id!: number;
  @Column({ type: 'uuid' })
  medail_id!: string;
  @CreateDateColumn({ type: 'timestamptz' })
  earned_at!: Date;
  @ManyToOne(() => User, (user) => user.medails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
  @ManyToOne(() => Medail, (medail) => medail.user_medails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medail_id' })
  medail!: Medail;
}
