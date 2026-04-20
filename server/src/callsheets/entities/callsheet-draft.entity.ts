import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'production_desk_callsheets' })
export class CallSheetDraftEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'integer' })
  CreatedByUserID!: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  title!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  productionDate!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload!: Record<string, unknown>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
