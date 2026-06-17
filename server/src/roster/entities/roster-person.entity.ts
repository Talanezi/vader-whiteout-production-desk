import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'production_desk_roster_people' })
export class RosterPersonEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'integer', nullable: true })
  CreatedByUserID!: number | null;

  @Column({ type: 'varchar', length: 255, default: '' })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: 'other' })
  category!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  roleOrDepartment!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  email!: string;

  @Column({ type: 'varchar', length: 80, default: '' })
  phone!: string;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
