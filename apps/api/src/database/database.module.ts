import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Log } from '../logs/entities/log.entity';
import { ErrorEvent } from '../errors/entities/error-event.entity';
import { Metric } from '../metrics/entities/metric.entity';
import { AlertRule } from '../alerts/entities/alert-rule.entity';
import { AlertIncident } from '../alerts/entities/alert-incident.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://obs:obs_secret@localhost:5432/observability',
      entities: [Organization, User, Project, Log, ErrorEvent, Metric, AlertRule, AlertIncident],
      synchronize: true,
      logging: false,
    }),
  ],
})
export class DatabaseModule {}
