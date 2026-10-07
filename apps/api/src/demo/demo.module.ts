import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Log } from '../logs/entities/log.entity';
import { ErrorEvent } from '../errors/entities/error-event.entity';
import { Metric } from '../metrics/entities/metric.entity';
import { AlertRule } from '../alerts/entities/alert-rule.entity';
import { LogsModule } from '../logs/logs.module';
import { ErrorsModule } from '../errors/errors.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Project, Log, ErrorEvent, Metric, AlertRule]),
    LogsModule, ErrorsModule, MetricsModule,
  ],
  providers: [DemoService],
  controllers: [DemoController],
})
export class DemoModule {}
