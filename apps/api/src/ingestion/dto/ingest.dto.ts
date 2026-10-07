import { IsString, IsOptional, IsNumber, IsObject, IsArray, IsDateString, IsEnum, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class LogItemDto {
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsEnum(['debug', 'info', 'warn', 'error', 'fatal'])
  level: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsString()
  @IsOptional()
  trace_id?: string;

  @IsString()
  @IsOptional()
  request_id?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  event_id?: string;
}

export class IngestLogsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(1000)
  @Type(() => LogItemDto)
  logs: LogItemDto[];
}

export class MetricItemDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsObject()
  @IsOptional()
  tags?: Record<string, any>;
}

export class IngestMetricsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(1000)
  @Type(() => MetricItemDto)
  metrics: MetricItemDto[];
}

export class ErrorItemDto {
  @IsString()
  type: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  stack_trace?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsString()
  @IsOptional()
  trace_id?: string;

  @IsString()
  @IsOptional()
  request_id?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class IngestErrorDto {
  @ValidateNested()
  @Type(() => ErrorItemDto)
  error: ErrorItemDto;

  @IsString()
  @IsOptional()
  event_id?: string;
}
