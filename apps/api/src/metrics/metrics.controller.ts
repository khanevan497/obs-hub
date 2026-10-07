import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('names')
  getNames(@Request() req) {
    return this.metricsService.getNames(req.user.organizationId);
  }

  @Get()
  query(
    @Request() req,
    @Query('name') name: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('aggregation') aggregation: string,
  ) {
    return this.metricsService.query(req.user.organizationId, name, from, to, aggregation || 'avg');
  }
}
