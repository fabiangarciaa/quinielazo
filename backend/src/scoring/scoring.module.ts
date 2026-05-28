import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { RankingModule } from '../ranking/ranking.module';
import { EventsModule } from '../events/events.module';
@Module({ imports:[RankingModule, EventsModule], providers:[ScoringService], exports:[ScoringService] })
export class ScoringModule {}
