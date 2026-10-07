import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AlertRule } from './alert-rule.entity';

export enum IncidentStatus {
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
}

@Entity('alert_incidents')
export class AlertIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  alert_rule_id: string;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.TRIGGERED })
  status: IncidentStatus;

  @CreateDateColumn()
  triggered_at: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  resolved_at: Date;

  @Column({ type: 'float', nullable: true })
  current_value: number;

  @Column({ nullable: true })
  message: string;

  @ManyToOne(() => AlertRule, rule => rule.incidents)
  @JoinColumn({ name: 'alert_rule_id' })
  alert_rule: AlertRule;
}
