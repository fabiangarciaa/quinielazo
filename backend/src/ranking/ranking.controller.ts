import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@ApiTags('Ranking') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('ranking')
export class RankingController {
  constructor(private svc: RankingService) {}
  @Get(':tournamentId') get(@Param('tournamentId') id: string) { return this.svc.getRanking(id); }
  @Get(':tournamentId/history') history(@Param('tournamentId') id: string) { return this.svc.getRankingHistory(id); }
}
