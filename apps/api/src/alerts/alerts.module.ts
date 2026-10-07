import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertIncident } from './entities/alert-incident.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([AlertRule, AlertIncident]), MetricsModule, WebsocketModule],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
