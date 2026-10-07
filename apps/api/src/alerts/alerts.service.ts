import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule, AlertCondition, AlertSeverity } from './entities/alert-rule.entity';
import { AlertIncident, IncidentStatus } from './entities/alert-incident.entity';
import { MetricsService } from '../metrics/metrics.service';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertRule) private ruleRepo: Repository<AlertRule>,
    @InjectRepository(AlertIncident) private incidentRepo: Repository<AlertIncident>,
    private metricsService: MetricsService,
    private gateway: EventsGateway,
  ) {}

  async findAll(organizationId: string) {
    const rules = await this.ruleRepo.find({ where: { organization_id: organizationId }, order: { created_at: 'DESC' } });
    const withIncidents = await Promise.all(rules.map(async rule => {
      const activeIncident = await this.incidentRepo.findOne({
        where: { alert_rule_id: rule.id, status: IncidentStatus.TRIGGERED }
      });
      return { ...rule, active_incident: activeIncident || null };
    }));
    return withIncidents;
  }

  async create(organizationId: string, projectId: string, dto: any) {
    const rule = this.ruleRepo.create({
      organization_id: organizationId,
      project_id: projectId,
      name: dto.name,
      metric_name: dto.metric_name,
      condition: dto.condition,
      threshold: dto.threshold,
      window_seconds: dto.window_seconds || 300,
      severity: dto.severity || AlertSeverity.WARNING,
      enabled: true,
    });
    return this.ruleRepo.save(rule);
  }

  async delete(id: string, organizationId: string) {
    await this.ruleRepo.delete({ id, organization_id: organizationId });
    return { deleted: true };
  }

  async getIncidents(ruleId: string, organizationId: string) {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId, organization_id: organizationId } });
    if (!rule) return [];
    return this.incidentRepo.find({ where: { alert_rule_id: ruleId }, order: { triggered_at: 'DESC' } });
  }

  async getActiveIncidents(organizationId: string) {
    const rules = await this.ruleRepo.find({ where: { organization_id: organizationId } });
    const ruleIds = rules.map(r => r.id);
    if (!ruleIds.length) return [];

    const incidents = await this.incidentRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.alert_rule', 'rule')
      .where('i.alert_rule_id IN (:...ruleIds)', { ruleIds })
      .andWhere('i.status = :status', { status: IncidentStatus.TRIGGERED })
      .orderBy('i.triggered_at', 'DESC')
      .getMany();

    return incidents;
  }

  async evaluateAlerts(organizationId: string, projectId: string, newMetrics: any[]) {
    const rules = await this.ruleRepo.find({
      where: { organization_id: organizationId, project_id: projectId, enabled: true }
    });

    for (const rule of rules) {
      const relevantMetrics = newMetrics.filter(m => m.name === rule.metric_name);
      if (!relevantMetrics.length) continue;

      const result = await this.metricsService.getAvgInWindow(organizationId, projectId, rule.metric_name, rule.window_seconds);
      const avg = parseFloat(result?.avg || '0');

      const breached = this.checkCondition(avg, rule.condition, rule.threshold);

      const activeIncident = await this.incidentRepo.findOne({
        where: { alert_rule_id: rule.id, status: IncidentStatus.TRIGGERED }
      });

      if (breached && !activeIncident) {
        const incident = this.incidentRepo.create({
          alert_rule_id: rule.id,
          status: IncidentStatus.TRIGGERED,
          current_value: avg,
          message: `${rule.metric_name} is ${avg.toFixed(2)} (threshold: ${rule.threshold})`,
        });
        const saved = await this.incidentRepo.save(incident);
        this.gateway.emitToOrg(organizationId, 'alert_triggered', { rule, incident: saved });
      } else if (!breached && activeIncident) {
        activeIncident.status = IncidentStatus.RESOLVED;
        activeIncident.resolved_at = new Date();
        await this.incidentRepo.save(activeIncident);
        this.gateway.emitToOrg(organizationId, 'alert_resolved', { rule, incident: activeIncident });
      }
    }
  }

  private checkCondition(value: number, condition: AlertCondition, threshold: number): boolean {
    switch (condition) {
      case AlertCondition.GT: return value > threshold;
      case AlertCondition.GTE: return value >= threshold;
      case AlertCondition.LT: return value < threshold;
      case AlertCondition.LTE: return value <= threshold;
      default: return false;
    }
  }
}
