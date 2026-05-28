// src/tournaments/tournaments.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private svc: TournamentsService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }

  @Get(':id/scoring-rules') getScoringRules(@Param('id') id: string) { return this.svc.getScoringRules(id); }
  @Patch(':id/scoring-rules/:ruleId') updateRule(
    @Param('ruleId') ruleId: string,
    @Body() body: { points: number; isActive: boolean },
  ) { return this.svc.updateScoringRule(ruleId, body.points, body.isActive); }
  @Post(':id/scoring-rules') upsertRule(
    @Param('id') id: string,
    @Body() body: { eventType: string; points: number; description?: string },
  ) { return this.svc.upsertScoringRule(id, body.eventType, body.points, body.description); }
}
