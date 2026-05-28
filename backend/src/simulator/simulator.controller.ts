import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SimulatorService } from './simulator.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@ApiTags('Simulator') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('simulator')
export class SimulatorController {
  constructor(private svc: SimulatorService) {}
  @Get(':tournamentId') simulate(@Param('tournamentId') id: string) { return this.svc.simulate(id); }
  @Post(':tournamentId/team-win') teamWin(@Param('tournamentId') tid: string, @Body() body:{teamId:string}) {
    return this.svc.simulateTeamWin(tid, body.teamId);
  }
}
