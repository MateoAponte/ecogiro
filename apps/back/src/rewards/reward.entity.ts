import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'varchar', length: 100 })
  name!: string;
  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'int', default: 0 })
  required_points!: number;
}
