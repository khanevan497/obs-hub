import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Organization } from '../organizations/entities/organization.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Log } from '../logs/entities/log.entity';
import { ErrorEvent } from '../errors/entities/error-event.entity';
import { Metric } from '../metrics/entities/metric.entity';
import { AlertRule, AlertCondition, AlertSeverity } from '../alerts/entities/alert-rule.entity';

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Log) private logRepo: Repository<Log>,
    @InjectRepository(ErrorEvent) private errorRepo: Repository<ErrorEvent>,
    @InjectRepository(Metric) private metricRepo: Repository<Metric>,
    @InjectRepository(AlertRule) private alertRuleRepo: Repository<AlertRule>,
  ) {}

  async seed() {
    // Check if already seeded
    const existing = await this.orgRepo.findOne({ where: { name: 'Demo Corp' } });
    if (existing) {
      const user = await this.userRepo.findOne({ where: { organization_id: existing.id } });
      const project = await this.projectRepo.findOne({ where: { organization_id: existing.id } });
      return { message: 'Already seeded', organization_id: existing.id, login: { email: 'admin@demo.com', password: 'demo123' } };
    }

    const org = await this.orgRepo.save(this.orgRepo.create({ name: 'Demo Corp' }));

    const password_hash = await bcrypt.hash('demo123', 10);
    const user = await this.userRepo.save(this.userRepo.create({
      organization_id: org.id,
      name: 'Admin User',
      email: 'admin@demo.com',
      password_hash,
      role: UserRole.OWNER,
    }));

    const rawKey = 'obs_' + crypto.randomBytes(16).toString('hex');
    const api_key_hash = await bcrypt.hash(rawKey, 10);
    const project = await this.projectRepo.save(this.projectRepo.create({
      organization_id: org.id,
      name: 'Production',
      slug: 'production',
      environment: 'production',
      api_key_hash,
    }));

    const services = ['api', 'payments', 'auth', 'worker', 'notifications'];
    const levels = ['debug', 'info', 'info', 'info', 'warn', 'warn', 'error', 'fatal'];
    const messages = [
      'Request processed successfully', 'User logged in', 'Database query executed',
      'Cache miss, fetching from DB', 'Connection pool near limit', 'Slow query detected',
      'Payment failed: card declined', 'Database connection timeout', 'Unexpected null value',
      'Memory usage high', 'Request completed', 'Worker job started', 'Worker job finished',
    ];

    // Seed 500 logs over the last 7 days
    const logs = [];
    for (let i = 0; i < 500; i++) {
      const hoursAgo = Math.random() * 7 * 24;
      const timestamp = new Date(Date.now() - hoursAgo * 3600 * 1000);
      logs.push(this.logRepo.create({
        organization_id: org.id,
        project_id: project.id,
        timestamp,
        level: levels[Math.floor(Math.random() * levels.length)] as any,
        message: messages[Math.floor(Math.random() * messages.length)],
        service: services[Math.floor(Math.random() * services.length)],
        environment: 'production',
        trace_id: `trace_${Math.random().toString(36).slice(2, 10)}`,
        metadata: { region: 'us-east-1', version: '1.2.3' },
      }));
    }
    await this.logRepo.save(logs);

    // Seed error events
    const errorTypes = ['DatabaseTimeout', 'PaymentFailed', 'UnauthorizedError', 'TypeError', 'NetworkError'];
    const errorMsgs = [
      'Connection timeout after 30s',
      'Card declined: insufficient funds',
      'JWT token expired',
      'Cannot read property of undefined',
      'ECONNREFUSED 127.0.0.1:5432',
    ];
    for (let i = 0; i < 50; i++) {
      const idx = Math.floor(Math.random() * errorTypes.length);
      const hoursAgo = Math.random() * 30 * 24;
      const fp = crypto.createHash('sha256').update(`${errorTypes[idx]}:${errorMsgs[idx]}`).digest('hex').slice(0, 16);
      await this.errorRepo.save(this.errorRepo.create({
        organization_id: org.id,
        project_id: project.id,
        timestamp: new Date(Date.now() - hoursAgo * 3600 * 1000),
        error_type: errorTypes[idx],
        message: errorMsgs[idx],
        stack_trace: `at processRequest (/app/src/api.js:45:12)\nat handler (/app/src/handler.js:23:5)\nat Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)`,
        service: services[Math.floor(Math.random() * services.length)],
        environment: 'production',
        fingerprint: fp + i.toString().slice(-4),
      }));
    }

    // Seed metrics: 1000 data points over 24h
    const metricNames = ['api.request.duration', 'api.request.count', 'api.error.count', 'worker.job.count', 'worker.job.duration'];
    const metrics = [];
    for (let i = 0; i < 1000; i++) {
      const name = metricNames[Math.floor(Math.random() * metricNames.length)];
      const minutesAgo = Math.random() * 24 * 60;
      let value = 0;
      if (name === 'api.request.duration') value = 100 + Math.random() * 900;
      else if (name === 'api.request.count') value = Math.floor(Math.random() * 100);
      else if (name === 'api.error.count') value = Math.floor(Math.random() * 10);
      else if (name === 'worker.job.count') value = Math.floor(Math.random() * 50);
      else value = 50 + Math.random() * 450;

      metrics.push(this.metricRepo.create({
        organization_id: org.id,
        project_id: project.id,
        timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
        name,
        value,
        service: 'api',
        environment: 'production',
        tags: { route: '/api/users', method: 'GET' },
      }));
    }
    await this.metricRepo.save(metrics);

    // Seed alert rule
    await this.alertRuleRepo.save(this.alertRuleRepo.create({
      organization_id: org.id,
      project_id: project.id,
      name: 'High API Latency',
      metric_name: 'api.request.duration',
      condition: AlertCondition.GT,
      threshold: 500,
      window_seconds: 300,
      severity: AlertSeverity.WARNING,
      enabled: true,
    }));

    return {
      message: 'Seeded successfully',
      organization_id: org.id,
      project_id: project.id,
      login: { email: 'admin@demo.com', password: 'demo123' },
    };
  }
}
