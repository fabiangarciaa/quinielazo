// src/matches/matches.module.ts
import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { ScoringModule } from '../scoring/scoring.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [ScoringModule, RankingModule],
  providers: [MatchesService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
