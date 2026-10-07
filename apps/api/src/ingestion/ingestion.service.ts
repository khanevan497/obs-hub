import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '../queue/inject-queue.decorator';
import { ProjectsService } from '../projects/projects.service';
import { IngestLogsDto, IngestMetricsDto, IngestErrorDto } from './dto/ingest.dto';
import Redis from 'ioredis';

const RATE_LIMIT = parseInt(process.env.INGESTION_RATE_LIMIT || '10000');

@Injectable()
export class IngestionService {
  private redis: Redis;

  constructor(
    private projectsService: ProjectsService,
    @InjectQueue('logs') private logsQueue: Queue,
    @InjectQueue('metrics') private metricsQueue: Queue,
    @InjectQueue('errors') private errorsQueue: Queue,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
  }

  async authenticateProject(authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Missing API key');
    const key = authHeader.slice(7);
    const project = await this.projectsService.validateApiKey(key);
    if (!project) throw new UnauthorizedException('Invalid API key');
    return project;
  }

  async checkRateLimit(projectId: string, count: number) {
    const key = `rate:project:${projectId}`;
    const current = await this.redis.incrby(key, count);
    if (current === count) {
      await this.redis.expire(key, 60);
    }
    if (current > RATE_LIMIT) {
      throw new HttpException('Rate limit exceeded', 429);
    }
  }

  async ingestLogs(authHeader: string, dto: IngestLogsDto) {
    const project = await this.authenticateProject(authHeader);
    await this.checkRateLimit(project.id, dto.logs.length);
    await this.logsQueue.add('process-logs', {
      organizationId: project.organization_id,
      projectId: project.id,
      logs: dto.logs,
    });
    return { accepted: dto.logs.length };
  }

  async ingestMetrics(authHeader: string, dto: IngestMetricsDto) {
    const project = await this.authenticateProject(authHeader);
    await this.checkRateLimit(project.id, dto.metrics.length);
    await this.metricsQueue.add('process-metrics', {
      organizationId: project.organization_id,
      projectId: project.id,
      metrics: dto.metrics,
    });
    return { accepted: dto.metrics.length };
  }

  async ingestError(authHeader: string, dto: IngestErrorDto) {
    const project = await this.authenticateProject(authHeader);
    await this.checkRateLimit(project.id, 1);
    await this.errorsQueue.add('process-error', {
      organizationId: project.organization_id,
      projectId: project.id,
      error: dto.error,
      event_id: dto.event_id,
    });
    return { accepted: 1 };
  }
}
