import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

@Entity('logs')
@Index(['organization_id', 'created_at'])
@Index(['organization_id', 'project_id', 'level'])
@Index(['organization_id', 'trace_id'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organization_id: string;

  @Column()
  project_id: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp: Date;

  @Column({ type: 'enum', enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

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

  @Column({ nullable: true })
  event_id: string;

  @CreateDateColumn()
  created_at: Date;
}
