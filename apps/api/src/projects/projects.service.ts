import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  async findAll(organizationId: string) {
    return this.projectRepo.find({
      where: { organization_id: organizationId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.projectRepo.findOne({ where: { id, organization_id: organizationId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(organizationId: string, dto: { name: string; environment?: string }) {
    const rawKey = 'obs_' + crypto.randomBytes(16).toString('hex');
    const api_key_hash = await bcrypt.hash(rawKey, 10);
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const project = this.projectRepo.create({
      organization_id: organizationId,
      name: dto.name,
      slug,
      environment: dto.environment || 'production',
      api_key_hash,
    });
    await this.projectRepo.save(project);

    return { ...project, api_key: rawKey };
  }

  async validateApiKey(rawKey: string): Promise<Project | null> {
    if (!rawKey.startsWith('obs_')) return null;
    const projects = await this.projectRepo.find();
    for (const project of projects) {
      const match = await bcrypt.compare(rawKey, project.api_key_hash);
      if (match) return project;
    }
    return null;
  }

  async delete(id: string, organizationId: string) {
    const project = await this.findOne(id, organizationId);
    await this.projectRepo.remove(project);
    return { deleted: true };
  }
}
