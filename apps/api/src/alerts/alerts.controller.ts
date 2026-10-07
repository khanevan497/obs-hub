import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(@Request() req) {
    return this.alertsService.findAll(req.user.organizationId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.alertsService.create(req.user.organizationId, body.project_id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.alertsService.delete(id, req.user.organizationId);
  }

  @Get(':id/incidents')
  getIncidents(@Param('id') id: string, @Request() req) {
    return this.alertsService.getIncidents(id, req.user.organizationId);
  }
}
