import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get()
  query(
    @Request() req,
    @Query('q') q: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.logsService.query(req.user.organizationId, q || '', from, to, parseInt(page || '1'), parseInt(limit || '50'));
  }

  @Get('timeseries')
  timeseries(@Request() req, @Query('from') from: string, @Query('to') to: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 24 * 3600 * 1000);
    const t = to ? new Date(to) : new Date();
    return this.logsService.getTimeSeries(req.user.organizationId, f, t);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.logsService.findOne(id, req.user.organizationId);
  }
}
