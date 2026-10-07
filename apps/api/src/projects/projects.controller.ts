import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() body: { name: string; environment?: string }, @Request() req) {
    return this.projectsService.create(req.user.organizationId, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.projectsService.delete(id, req.user.organizationId);
  }
}
