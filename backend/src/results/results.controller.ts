import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@ApiTags('Results') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('results')
export class ResultsController {
  constructor(private svc: ResultsService) {}
  @Get() findAll(@Query('tournamentId') tid: string) { return this.svc.findByTournament(tid); }
  @Get(':id/impact') impact(@Param('id') id: string) { return this.svc.getImpact(id); }
}
