import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ErrorEvent } from './entities/error-event.entity';

@Injectable()
export class ErrorsService {
  constructor(@InjectRepository(ErrorEvent) private errorRepo: Repository<ErrorEvent>) {}

  private computeFingerprint(type: string, message: string, stackTrace: string): string {
    const normalizedMsg = message.replace(/\d+/g, 'N').replace(/['"]/g, '');
    const topFrames = (stackTrace || '').split('\n').slice(0, 3).join('\n');
    return crypto.createHash('sha256').update(`${type}:${normalizedMsg}:${topFrames}`).digest('hex').slice(0, 16);
  }

  async create(organizationId: string, projectId: string, error: any, event_id?: string) {
    if (event_id) {
      const existing = await this.errorRepo.findOne({ where: { project_id: projectId, event_id } });
      if (existing) return null;
    }

    const fingerprint = this.computeFingerprint(error.type, error.message, error.stack_trace);
    const entity = this.errorRepo.create({
      organization_id: organizationId,
      project_id: projectId,
      timestamp: new Date(),
      error_type: error.type,
      message: error.message,
      stack_trace: error.stack_trace,
      service: error.service,
      environment: error.environment,
      trace_id: error.trace_id,
      request_id: error.request_id,
      metadata: error.metadata,
      fingerprint,
      event_id,
    });

    return this.errorRepo.save(entity);
  }

  async getGroups(organizationId: string) {
    const result = await this.errorRepo.createQueryBuilder('e')
      .select('e.fingerprint', 'fingerprint')
      .addSelect('e.error_type', 'error_type')
      .addSelect('MIN(e.message)', 'message')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MIN(e.created_at)', 'first_seen')
      .addSelect('MAX(e.created_at)', 'last_seen')
      .addSelect('array_agg(DISTINCT e.service) FILTER (WHERE e.service IS NOT NULL)', 'services')
      .where('e.organization_id = :orgId', { orgId: organizationId })
      .groupBy('e.fingerprint, e.error_type')
      .orderBy('count', 'DESC')
      .getRawMany();
    return result;
  }

  async getGroupDetail(fingerprint: string, organizationId: string) {
    const events = await this.errorRepo.find({
      where: { fingerprint, organization_id: organizationId },
      order: { created_at: 'DESC' },
      take: 20,
    });
    if (!events.length) return null;

    const count = await this.errorRepo.count({ where: { fingerprint, organization_id: organizationId } });
    return {
      fingerprint,
      error_type: events[0].error_type,
      message: events[0].message,
      stack_trace: events[0].stack_trace,
      count,
      first_seen: events[events.length - 1].created_at,
      last_seen: events[0].created_at,
      recent_events: events,
    };
  }

  async countToday(organizationId: string) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.errorRepo.count({ where: { organization_id: organizationId } });
  }

  async deleteOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await this.errorRepo.createQueryBuilder().delete().from(ErrorEvent).where('created_at < :cutoff', { cutoff }).execute();
  }
}
