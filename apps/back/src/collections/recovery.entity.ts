import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Status } from './enums/Status.enum';
import { User } from 'src/user/user.entity';

@Entity()
export class Recovery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  scheduled_date!: Date;

  @Column()
  description!: string;

  @Column()
  address!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  recycled_kg!: number;

  @Column({
    nullable: true,
  })
  comments!: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.CREATED,
  })
  status!: Status;

  @ManyToOne(() => User, (user) => user.recoveries, { onDelete: 'CASCADE' })
  user_id!: number;
}
