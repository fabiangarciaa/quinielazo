import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PhasesService } from './phases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Phases') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('phases')
export class PhasesController {
  constructor(private svc: PhasesService) {}

  @Get() findAll(@Query('tournamentId') tid: string) { return this.svc.findByTournament(tid); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Patch(':id/activate') activate(@Param('id') id: string) { return this.svc.setActive(id); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Get(':id/teams') getTeams(@Param('id') id: string) { return this.svc.getTeamsInPhase(id); }
  @Post(':id/close') closePhase(@Param('id') id: string, @Body() body: { advancingTeamIds: string[] }) {
    return this.svc.closePhase(id, body.advancingTeamIds);
  }
}
