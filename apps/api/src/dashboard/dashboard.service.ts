import { Injectable } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';
import { ErrorsService } from '../errors/errors.service';
import { MetricsService } from '../metrics/metrics.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class DashboardService {
  constructor(
    private logsService: LogsService,
    private errorsService: ErrorsService,
    private metricsService: MetricsService,
    private alertsService: AlertsService,
  ) {}

  async getSummary(organizationId: string) {
    const [eventsToday, errorsToday, p95Latency, activeIncidents, logsTimeSeries, errorsTimeSeries] = await Promise.all([
      this.logsService.countToday(organizationId),
      this.errorsService.countToday(organizationId),
      this.metricsService.getP95Latency(organizationId),
      this.alertsService.getActiveIncidents(organizationId),
      this.logsService.getTimeSeries(organizationId, new Date(Date.now() - 24 * 3600 * 1000), new Date()),
      this.errorsService.countToday(organizationId),
    ]);

    const errorRate = eventsToday > 0 ? ((errorsToday / eventsToday) * 100).toFixed(1) : '0';

    return {
      events_today: eventsToday,
      errors_today: errorsToday,
      error_rate: parseFloat(errorRate),
      p95_latency: Math.round(p95Latency),
      active_incidents: activeIncidents.length,
      incidents: activeIncidents,
      logs_timeseries: logsTimeSeries,
    };
  }
}
