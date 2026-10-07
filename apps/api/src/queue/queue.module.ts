import { Module, Global } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { getQueueToken } from './inject-queue.decorator';
import { LogsModule } from '../logs/logs.module';
import { ErrorsModule } from '../errors/errors.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AlertsModule } from '../alerts/alerts.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { LogsService } from '../logs/logs.service';
import { ErrorsService } from '../errors/errors.service';
import { MetricsService } from '../metrics/metrics.service';
import { AlertsService } from '../alerts/alerts.service';
import { EventsGateway } from '../websocket/events.gateway';

const redisConnection = {
  host: (process.env.REDIS_URL || 'redis://localhost:6379').replace('redis://', '').split(':')[0],
  port: parseInt((process.env.REDIS_URL || 'redis://localhost:6379').split(':')[2] || '6379'),
};

function createQueue(name: string) {
  return {
    provide: getQueueToken(name),
    useFactory: () => new Queue(name, { connection: redisConnection }),
  };
}

@Global()
@Module({
  imports: [LogsModule, ErrorsModule, MetricsModule, AlertsModule, WebsocketModule],
  providers: [
    createQueue('logs'),
    createQueue('metrics'),
    createQueue('errors'),
    {
      provide: 'WORKERS',
      inject: [
        getQueueToken('logs'),
        getQueueToken('metrics'),
        getQueueToken('errors'),
        LogsService,
        ErrorsService,
        MetricsService,
        AlertsService,
        EventsGateway,
      ],
      useFactory: (
        logsQueue: Queue,
        metricsQueue: Queue,
        errorsQueue: Queue,
        logsService: LogsService,
        errorsService: ErrorsService,
        metricsService: MetricsService,
        alertsService: AlertsService,
        gateway: EventsGateway,
      ) => {
        const logsWorker = new Worker('logs', async (job) => {
          const { organizationId, projectId, logs } = job.data;
          const saved = await logsService.bulkCreate(organizationId, projectId, logs);
          saved.forEach(log => gateway.emitToOrg(organizationId, 'new_log', log));
        }, { connection: redisConnection });

        const errorsWorker = new Worker('errors', async (job) => {
          const { organizationId, projectId, error, event_id } = job.data;
          const saved = await errorsService.create(organizationId, projectId, error, event_id);
          if (saved) gateway.emitToOrg(organizationId, 'new_error', saved);
        }, { connection: redisConnection });

        const metricsWorker = new Worker('metrics', async (job) => {
          const { organizationId, projectId, metrics } = job.data;
          await metricsService.bulkCreate(organizationId, projectId, metrics);
          await alertsService.evaluateAlerts(organizationId, projectId, metrics);
        }, { connection: redisConnection });

        logsWorker.on('failed', (job, err) => console.error('Log worker failed:', err.message));
        errorsWorker.on('failed', (job, err) => console.error('Error worker failed:', err.message));
        metricsWorker.on('failed', (job, err) => console.error('Metric worker failed:', err.message));

        return [logsWorker, errorsWorker, metricsWorker];
      },
    },
  ],
  exports: [getQueueToken('logs'), getQueueToken('metrics'), getQueueToken('errors')],
})
export class QueueModule {}
