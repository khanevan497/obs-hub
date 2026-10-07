import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestLogsDto, IngestMetricsDto, IngestErrorDto } from './dto/ingest.dto';

@Controller('ingest')
export class IngestionController {
  constructor(private ingestionService: IngestionService) {}

  @Post('logs')
  @HttpCode(202)
  ingestLogs(@Headers('authorization') auth: string, @Body() dto: IngestLogsDto) {
    return this.ingestionService.ingestLogs(auth, dto);
  }

  @Post('metrics')
  @HttpCode(202)
  ingestMetrics(@Headers('authorization') auth: string, @Body() dto: IngestMetricsDto) {
    return this.ingestionService.ingestMetrics(auth, dto);
  }

  @Post('errors')
  @HttpCode(202)
  ingestError(@Headers('authorization') auth: string, @Body() dto: IngestErrorDto) {
    return this.ingestionService.ingestError(auth, dto);
  }
}
