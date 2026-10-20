import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MedailCondition } from './enums/medail-condition.enum';
import { UserMedail } from './user-medail.entity';
@Entity()
export class Medail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'varchar', length: 100 })
  name!: string;
  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url!: string | null;

  @Column({ type: 'enum', enum: MedailCondition })
  condition_type!: MedailCondition;
  @Column({ type: 'int' })
  condition_value!: number;
  @OneToMany(() => UserMedail, (assignment) => assignment.medail)
  user_medails!: UserMedail[];
}
