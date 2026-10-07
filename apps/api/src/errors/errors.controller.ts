import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorsService } from './errors.service';

@Controller('errors')
@UseGuards(JwtAuthGuard)
export class ErrorsController {
  constructor(private errorsService: ErrorsService) {}

  @Get('groups')
  getGroups(@Request() req) {
    return this.errorsService.getGroups(req.user.organizationId);
  }

  @Get('groups/:fingerprint')
  getGroupDetail(@Param('fingerprint') fingerprint: string, @Request() req) {
    return this.errorsService.getGroupDetail(fingerprint, req.user.organizationId);
  }
}
