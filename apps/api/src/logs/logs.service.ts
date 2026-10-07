import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Log } from './entities/log.entity';

@Injectable()
export class LogsService {
  constructor(@InjectRepository(Log) private logRepo: Repository<Log>) {}

  async bulkCreate(organizationId: string, projectId: string, logs: any[]) {
    const entities = logs.map(l => this.logRepo.create({
      organization_id: organizationId,
      project_id: projectId,
      timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
      level: l.level,
      message: l.message,
      service: l.service,
      environment: l.environment,
      trace_id: l.trace_id,
      request_id: l.request_id,
      metadata: l.metadata,
      event_id: l.event_id,
    }));

    const saved = [];
    for (const entity of entities) {
      try {
        if (entity.event_id) {
          const existing = await this.logRepo.findOne({
            where: { project_id: projectId, event_id: entity.event_id }
          });
          if (existing) continue;
        }
        const result = await this.logRepo.save(entity);
        saved.push(result);
      } catch (e) {
        // skip duplicates
      }
    }
    return saved;
  }

  async query(organizationId: string, queryStr: string, from?: string, to?: string, page = 1, limit = 50) {
    const qb = this.logRepo.createQueryBuilder('log')
      .where('log.organization_id = :orgId', { orgId: organizationId })
      .orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (from) qb.andWhere('log.timestamp >= :from', { from: new Date(from) });
    if (to) qb.andWhere('log.timestamp <= :to', { to: new Date(to) });

    if (queryStr) {
      const parts = queryStr.trim().split(/\s+/);
      const freeText: string[] = [];
      for (const part of parts) {
        if (part.includes(':')) {
          const [key, val] = part.split(':');
          if (key === 'level') qb.andWhere('log.level = :level', { level: val });
          else if (key === 'service') qb.andWhere('log.service = :service', { service: val });
          else if (key === 'environment') qb.andWhere('log.environment = :env', { env: val });
          else if (key === 'trace_id') qb.andWhere('log.trace_id = :traceId', { traceId: val });
        } else {
          freeText.push(part);
        }
      }
      if (freeText.length > 0) {
        qb.andWhere('log.message ILIKE :text', { text: `%${freeText.join(' ')}%` });
      }
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, organizationId: string) {
    return this.logRepo.findOne({ where: { id, organization_id: organizationId } });
  }

  async findByTraceId(traceId: string, organizationId: string) {
    return this.logRepo.find({ where: { trace_id: traceId, organization_id: organizationId }, order: { timestamp: 'ASC' } });
  }

  async countToday(organizationId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.logRepo.count({ where: { organization_id: organizationId } });
  }

  async getTimeSeries(organizationId: string, from: Date, to: Date, bucketMinutes = 60) {
    const result = await this.logRepo.createQueryBuilder('log')
      .select(`date_trunc('hour', log.timestamp)`, 'bucket')
      .addSelect('COUNT(*)', 'count')
      .where('log.organization_id = :orgId', { orgId: organizationId })
      .andWhere('log.timestamp BETWEEN :from AND :to', { from, to })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany();
    return result;
  }

  async deleteOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await this.logRepo.createQueryBuilder()
      .delete()
      .from(Log)
      .where('created_at < :cutoff', { cutoff })
      .execute();
  }
}
