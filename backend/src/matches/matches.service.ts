// src/matches/matches.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private scoring: ScoringService,
    private ranking: RankingService,
  ) {}

  findByTournament(tournamentId: string, phaseId?: string) {
    return this.prisma.match.findMany({
      where: { tournamentId, ...(phaseId ? { phaseId } : {}) },
      include: {
        homeTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
        awayTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
        phase: true,
        result: true,
      },
      orderBy: [{ status: 'asc' }, { matchDate: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.match.findUniqueOrThrow({
      where: { id },
      include: {
        homeTeam: { include: { participant: true } },
        awayTeam: { include: { participant: true } },
        phase: true,
        result: true,
      },
    });
  }

  create(data: { tournamentId: string; phaseId: string; homeTeamId: string; awayTeamId: string; matchDate?: string; notes?: string }) {
    return this.prisma.match.create({
      data: { ...data, matchDate: data.matchDate ? new Date(data.matchDate) : undefined },
      include: { homeTeam: true, awayTeam: true, phase: true },
    });
  }

  async createBulk(tournamentId: string, phaseId: string, matchups: Array<{ homeTeamId: string; awayTeamId: string; matchDate?: string }>) {
    const data = matchups.map(m => ({
      tournamentId,
      phaseId,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      matchDate: m.matchDate ? new Date(m.matchDate) : undefined,
    }));
    await this.prisma.match.createMany({ data });
    return this.findByTournament(tournamentId, phaseId);
  }

  update(id: string, data: { matchDate?: string; notes?: string; status?: any }) {
    return this.prisma.match.update({
      where: { id },
      data: { ...data, matchDate: data.matchDate ? new Date(data.matchDate) : undefined },
    });
  }

  delete(id: string) {
    return this.prisma.match.delete({ where: { id } });
  }

  async recordResult(matchId: string, data: {
    homeGoals: number;
    awayGoals: number;
    hadPenalties?: boolean;
    advancingTeamId?: string;
  }) {
    return this.scoring.processResult({ matchId, ...data });
  }

  async correctResult(matchId: string, data: { homeGoals: number; awayGoals: number; hadPenalties?: boolean; advancingTeamId?: string }) {
    const existingResult = await this.prisma.result.findUnique({ where: { matchId } });
    if (existingResult) {
      // Restar puntos generados por este resultado
      const scores = await this.prisma.participantScore.findMany({ where: { resultId: existingResult.id } });
      for (const score of scores) {
        await this.prisma.participant.update({
          where: { id: score.participantId },
          data: { totalPoints: { decrement: score.pointsEarned } },
        });
      }
      await this.prisma.participantScore.deleteMany({ where: { resultId: existingResult.id } });
      await this.prisma.teamScore.deleteMany({ where: { resultId: existingResult.id } });
      await this.prisma.result.delete({ where: { id: existingResult.id } });
      await this.prisma.match.update({ where: { id: matchId }, data: { status: 'SCHEDULED' } });
    }

    // Procesar nuevo resultado y reconstruir historial
    const result = await this.scoring.processResult({ matchId, ...data });
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (match) await this.ranking.rebuildHistory(match.tournamentId);
    return result;
  }

  async deleteResult(matchId: string) {
    const existingResult = await this.prisma.result.findUnique({ where: { matchId } });
    if (!existingResult) throw new Error('No hay resultado registrado para este partido');

    // Restar puntos generados
    const scores = await this.prisma.participantScore.findMany({ where: { resultId: existingResult.id } });
    for (const score of scores) {
      await this.prisma.participant.update({
        where: { id: score.participantId },
        data: { totalPoints: { decrement: score.pointsEarned } },
      });
    }

    await this.prisma.participantScore.deleteMany({ where: { resultId: existingResult.id } });
    await this.prisma.teamScore.deleteMany({ where: { resultId: existingResult.id } });

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });

    await this.prisma.result.delete({ where: { id: existingResult.id } });

    // Restaurar equipo eliminado a ACTIVE si aplica
    if (existingResult.advancingTeamId && match) {
      const eliminatedTeamId = existingResult.advancingTeamId === match.homeTeamId
        ? match.awayTeamId : match.homeTeamId;
      if (eliminatedTeamId) {
        await this.prisma.team.update({
          where: { id: eliminatedTeamId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    await this.prisma.match.update({ where: { id: matchId }, data: { status: 'SCHEDULED' } });

    // Recalcular ranking y reconstruir historial
    if (match) {
      await this.ranking.recalculateRanking(match.tournamentId);
      await this.ranking.rebuildHistory(match.tournamentId);

      // Si no quedan resultados, resetear prevRank para tendencia 'same'
      const remainingResults = await this.prisma.result.count({
        where: { match: { tournamentId: match.tournamentId } },
      });
      if (remainingResults === 0) {
        const participants = await this.prisma.participant.findMany({
          where: { tournamentId: match.tournamentId },
        });
        for (const p of participants) {
          await this.prisma.participant.update({
            where: { id: p.id },
            data: { prevRank: p.currentRank },
          });
        }
      }
    }

    return { message: 'Resultado eliminado correctamente' };
  }
}