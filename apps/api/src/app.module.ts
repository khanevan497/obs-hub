import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { LogsModule } from './logs/logs.module';
import { ErrorsModule } from './errors/errors.module';
import { MetricsModule } from './metrics/metrics.module';
import { AlertsModule } from './alerts/alerts.module';
import { QueueModule } from './queue/queue.module';
import { WebsocketModule } from './websocket/websocket.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ProjectsModule,
    IngestionModule,
    LogsModule,
    ErrorsModule,
    MetricsModule,
    AlertsModule,
    QueueModule,
    WebsocketModule,
    DashboardModule,
    DemoModule,
  ],
})
export class AppModule {}
