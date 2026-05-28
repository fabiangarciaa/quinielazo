import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@ApiTags('Audit') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('audit')
export class AuditController {
  constructor(private svc: AuditService) {}
  @Get() findAll(@Query('entityType') et?: string) { return this.svc.findAll(et); }
}
