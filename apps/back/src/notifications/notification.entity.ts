import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Recovery } from '../collections/recovery.entity';

export enum NotificationType {
  RECOVERY_ACCEPTED = 'recovery.accepted',
  RECOVERY_REJECTED = 'recovery.rejected',
  RECOVERY_COMPLETED = 'recovery.completed',
  RECOVERY_CANCELED = 'recovery.canceled',
}

@Entity('notification')
@Index(['recipient_id', 'created_at'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  recipient_id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: User;

  @Column({ type: 'uuid', nullable: true })
  recovery_id!: string | null;

  @ManyToOne(() => Recovery, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recovery_id' })
  recovery!: Recovery | null;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  read_at!: Date | null;
}
