import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LogsModule } from '../logs/logs.module';
import { ErrorsModule } from '../errors/errors.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [LogsModule, ErrorsModule, MetricsModule, AlertsModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
