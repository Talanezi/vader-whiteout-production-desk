import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn()
  ID!: number;

  @Column({ nullable: true })
  PasswordHash?: string;

  @Column({ nullable: true })
  TimestampOfEarliestValidToken?: number;

  @Column()
  Name!: string;

  @Index({ unique: true })
  @Column()
  Email!: string;

  @Column({ default: false })
  IsSubscribedToNotifications!: boolean;

  @Column({ nullable: true })
  Department?: string;

  @Column({ nullable: true })
  Role?: string;
}
