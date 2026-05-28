import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { ParticipantsModule } from './participants/participants.module';
import { TeamsModule } from './teams/teams.module';
import { PotsModule } from './pots/pots.module';
import { DrawsModule } from './draws/draws.module';
import { PhasesModule } from './phases/phases.module';
import { MatchesModule } from './matches/matches.module';
import { ResultsModule } from './results/results.module';
import { ScoringModule } from './scoring/scoring.module';
import { RankingModule } from './ranking/ranking.module';
import { SimulatorModule } from './simulator/simulator.module';
import { ExportModule } from './export/export.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    PrismaModule, AuthModule, UsersModule, TournamentsModule,
    ParticipantsModule, TeamsModule, PotsModule, DrawsModule,
    PhasesModule, MatchesModule, ResultsModule, ScoringModule,
    RankingModule, SimulatorModule, ExportModule, AuditModule, EventsModule,
  ],
})
export class AppModule {}
