import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('error_events')
@Index(['organization_id', 'created_at'])
@Index(['organization_id', 'fingerprint'])
export class ErrorEvent {
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
  error_type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack_trace: string;

  @Column({ nullable: true })
  service: string;

  @Column({ nullable: true })
  environment: string;

  @Column({ nullable: true })
  trace_id: string;

  @Column({ nullable: true })
  request_id: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column()
  @Index()
  fingerprint: string;

  @Column({ nullable: true })
  event_id: string;

  @CreateDateColumn()
  created_at: Date;
}
