// src/ranking/ranking.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RankingEntry {
  participantId: string;
  participantName: string;
  alias: string | null;
  avatarUrl: string | null;
  rank: number;
  prevRank: number;
  totalPoints: number;
  aliveTeams: number;
  eliminatedTeams: number;
  hasChampion: boolean;
  totalWins: number;
  totalGoalDiff: number;
  trend: 'up' | 'down' | 'same';
  pointsBreakdown: Array<{ reason: string; points: number; earnedAt: Date }>;
}

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async getRanking(tournamentId: string): Promise<RankingEntry[]> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: {
        teams: true,
        scores: { orderBy: { earnedAt: 'desc' }, take: 20 },
      },
    });

    const entries: RankingEntry[] = participants.map(p => {
      const aliveTeams = p.teams.filter(t => t.status === 'ACTIVE').length;
      const hasChampion = p.teams.some(t => t.status === 'CHAMPION');
      const totalWins = p.teams.reduce((acc, t) => acc + t.wins, 0);
      const totalGoalDiff = p.teams.reduce((acc, t) => acc + (t.goalsFor - t.goalsAgainst), 0);

      return {
        participantId: p.id,
        participantName: p.name,
        alias: p.alias,
        avatarUrl: p.avatarUrl,
        rank: p.currentRank,
        prevRank: p.prevRank,
        totalPoints: p.totalPoints,
        aliveTeams,
        eliminatedTeams: p.teams.length - aliveTeams,
        hasChampion,
        totalWins,
        totalGoalDiff,
        trend: p.currentRank < p.prevRank ? 'up' : p.currentRank > p.prevRank ? 'down' : 'same',
        pointsBreakdown: p.scores.map(s => ({ reason: s.reason, points: s.pointsEarned, earnedAt: s.earnedAt })),
      };
    });

    return entries.sort((a, b) => a.rank - b.rank);
  }

  async recalculateRanking(tournamentId: string): Promise<RankingEntry[]> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
    });

    // Ordenar por criterios de desempate
    const sorted = participants.sort((a, b) => {
      // 1. Puntos totales
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      // 2. Equipos vivos
      const aAlive = a.teams.filter(t => t.status === 'ACTIVE').length;
      const bAlive = b.teams.filter(t => t.status === 'ACTIVE').length;
      if (bAlive !== aAlive) return bAlive - aAlive;
      // 3. Tiene campeón
      const aChamp = a.teams.some(t => t.status === 'CHAMPION') ? 1 : 0;
      const bChamp = b.teams.some(t => t.status === 'CHAMPION') ? 1 : 0;
      if (bChamp !== aChamp) return bChamp - aChamp;
      // 4. Victorias totales
      const aWins = a.teams.reduce((acc, t) => acc + t.wins, 0);
      const bWins = b.teams.reduce((acc, t) => acc + t.wins, 0);
      return bWins - aWins;
    });

    // Actualizar rangos
    for (let i = 0; i < sorted.length; i++) {
      const newRank = i + 1;
      await this.prisma.participant.update({
        where: { id: sorted[i].id },
        data: { prevRank: sorted[i].currentRank, currentRank: newRank },
      });
    }

    return this.getRanking(tournamentId);
  }

  async saveRankingSnapshot(tournamentId: string): Promise<void> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
    });

    const snapshots = participants.map(p => ({
      tournamentId,
      participantId: p.id,
      rank: p.currentRank,
      totalPoints: p.totalPoints,
      aliveTeams: p.teams.filter(t => t.status === 'ACTIVE').length,
    }));

    await this.prisma.rankingHistory.createMany({ data: snapshots });
  }

  async getRankingHistory(tournamentId: string, participantId?: string) {
    return this.prisma.rankingHistory.findMany({
      where: { tournamentId, ...(participantId ? { participantId } : {}) },
      include: { participant: true },
      orderBy: { snapshotAt: 'asc' },
    });
  }
}
