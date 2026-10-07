import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('metrics')
@Index(['organization_id', 'name', 'timestamp'])
@Index(['organization_id', 'project_id', 'name'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organization_id: string;

  @Column()
  project_id: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp: Date;

  @Column()
  name: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ nullable: true })
  service: string;

  @Column({ nullable: true })
  environment: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
