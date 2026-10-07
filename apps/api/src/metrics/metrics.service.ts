import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';

@Injectable()
export class MetricsService {
  constructor(@InjectRepository(Metric) private metricRepo: Repository<Metric>) {}

  async bulkCreate(organizationId: string, projectId: string, metrics: any[]) {
    const entities = metrics.map(m => this.metricRepo.create({
      organization_id: organizationId,
      project_id: projectId,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      name: m.name,
      value: m.value,
      service: m.service,
      environment: m.environment,
      tags: m.tags,
    }));
    return this.metricRepo.save(entities);
  }

  async query(organizationId: string, name: string, from?: string, to?: string, aggregation = 'avg', windowSeconds = 60) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 3600 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const aggFn = { avg: 'AVG', sum: 'SUM', count: 'COUNT', min: 'MIN', max: 'MAX' }[aggregation] || 'AVG';

    const result = await this.metricRepo.createQueryBuilder('m')
      .select(`date_trunc('minute', m.timestamp)`, 'bucket')
      .addSelect(`${aggFn}(m.value)`, 'value')
      .where('m.organization_id = :orgId', { orgId: organizationId })
      .andWhere('m.name = :name', { name })
      .andWhere('m.timestamp BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany();

    return result;
  }

  async getNames(organizationId: string) {
    const result = await this.metricRepo.createQueryBuilder('m')
      .select('DISTINCT m.name', 'name')
      .where('m.organization_id = :orgId', { orgId: organizationId })
      .getRawMany();
    return result.map(r => r.name);
  }

  async getAvgInWindow(organizationId: string, projectId: string, metricName: string, windowSeconds: number) {
    const from = new Date(Date.now() - windowSeconds * 1000);
    const result = await this.metricRepo.createQueryBuilder('m')
      .select('AVG(m.value)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('m.organization_id = :orgId', { orgId: organizationId })
      .andWhere('m.project_id = :projectId', { projectId })
      .andWhere('m.name = :name', { name: metricName })
      .andWhere('m.timestamp >= :from', { from })
      .getRawOne();
    return result;
  }

  async getP95Latency(organizationId: string) {
    const from = new Date(Date.now() - 3600 * 1000);
    const result = await this.metricRepo.createQueryBuilder('m')
      .select('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.value)', 'p95')
      .where('m.organization_id = :orgId', { orgId: organizationId })
      .andWhere('m.name = :name', { name: 'api.request.duration' })
      .andWhere('m.timestamp >= :from', { from })
      .getRawOne();
    return result?.p95 || 0;
  }

  async deleteOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await this.metricRepo.createQueryBuilder().delete().from(Metric).where('created_at < :cutoff', { cutoff }).execute();
  }
}
