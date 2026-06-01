// src/scoring/scoring.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../ranking/ranking.service';
import { EventsGateway } from '../events/events.gateway';

export interface MatchResultData {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  hadPenalties?: boolean;
  advancingTeamId?: string;
}

@Injectable()
export class ScoringService {
  constructor(
    private prisma: PrismaService,
    private rankingService: RankingService,
    private eventsGateway: EventsGateway,
  ) {}

  async processResult(data: MatchResultData): Promise<{
    result: any;
    pointsGenerated: Array<{ participantId: string; points: number; reason: string }>;
    rankingBefore: any[];
    rankingAfter: any[];
    summary: string;
  }> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: data.matchId },
      include: {
        homeTeam: { include: { participant: true } },
        awayTeam: { include: { participant: true } },
        phase: true,
      },
    });

    const goalDiff = Math.abs(data.homeGoals - data.awayGoals);
    const isThrashing = goalDiff >= 3;
    const homeWon = data.homeGoals > data.awayGoals;
    const awayWon = data.awayGoals > data.homeGoals;
    const isDraw = data.homeGoals === data.awayGoals;
    const homeCleanSheet = data.awayGoals === 0;
    const awayCleanSheet = data.homeGoals === 0;
    const winnerTeamId = homeWon ? match.homeTeamId : awayWon ? match.awayTeamId : null;

    const rankingBefore = await this.rankingService.getRanking(match.tournamentId);

    const result = await this.prisma.result.create({
      data: {
        matchId: data.matchId,
        homeGoals: data.homeGoals,
        awayGoals: data.awayGoals,
        winnerTeamId,
        hadPenalties: data.hadPenalties || false,
        homeCleanSheet,
        awayCleanSheet,
        isThrashing,
        advancingTeamId: data.advancingTeamId || winnerTeamId,
      },
    });

    await this.updateTeamStats(match, data, homeWon, awayWon, isDraw, homeCleanSheet, awayCleanSheet, isThrashing);

    const rules = await this.prisma.scoringRule.findMany({
      where: { tournamentId: match.tournamentId, isActive: true },
    });

    const pointsGenerated: Array<{ participantId: string; teamId: string; points: number; reason: string; ruleId: string }> = [];

    for (const [teamId, isWinner, isHome] of [
      [match.homeTeamId, homeWon, true],
      [match.awayTeamId, awayWon, false],
    ] as [string, boolean, boolean][]) {
      const team = isHome ? match.homeTeam : match.awayTeam;
      if (!team.participantId) continue;

      const teamPoints = this.calculateTeamPoints({
        rules,
        phase: match.phase,
        isWinner,
        isDraw,
        cleanSheet: isHome ? homeCleanSheet : awayCleanSheet,
        isThrashing: isThrashing && isWinner,
        advancing: data.advancingTeamId === teamId,
      });

      for (const { points, reason, eventType } of teamPoints) {
        if (points === 0) continue;
        const rule = rules.find(r => r.eventType === eventType);
        pointsGenerated.push({
          participantId: team.participantId,
          teamId,
          points,
          reason,
          ruleId: rule?.id || '',
        });
      }
    }

    for (const p of pointsGenerated) {
      await this.prisma.participantScore.create({
        data: {
          participantId: p.participantId,
          tournamentId: match.tournamentId,
          resultId: result.id,
          scoringRuleId: p.ruleId || null,
          teamId: p.teamId,
          pointsEarned: p.points,
          reason: p.reason,
        },
      });

      await this.prisma.participant.update({
        where: { id: p.participantId },
        data: { totalPoints: { increment: p.points } },
      });
    }

    // Marcar equipo eliminado solo en fases eliminatorias (no en grupos)
    // Excepción: en THIRD_PLACE ambos se eliminan al terminar
    if (data.advancingTeamId && match.phase.type !== 'GROUP_STAGE') {
      if (match.phase.type === 'THIRD_PLACE') {
        // En tercer lugar, ambos quedan eliminados al terminar
        await this.prisma.team.update({
          where: { id: match.homeTeamId },
          data: { status: 'ELIMINATED' },
        });
        await this.prisma.team.update({
          where: { id: match.awayTeamId },
          data: { status: 'ELIMINATED' },
        });
      } else {
        // En otras fases eliminatorias, solo el perdedor
        const eliminatedTeamId = data.advancingTeamId === match.homeTeamId
          ? match.awayTeamId : match.homeTeamId;
        await this.prisma.team.update({
          where: { id: eliminatedTeamId },
          data: { status: 'ELIMINATED' },
        });
      }
    }

    await this.prisma.match.update({
      where: { id: data.matchId },
      data: { status: 'FINISHED' },
    });

    const rankingAfter = await this.rankingService.recalculateRanking(match.tournamentId);
    await this.rankingService.saveRankingSnapshot(match.tournamentId);
    const summary = this.generateSummary(match, data, pointsGenerated, rankingBefore, rankingAfter);

    this.eventsGateway.emitRankingUpdate(match.tournamentId, {
      result,
      pointsGenerated,
      rankingAfter,
      summary,
    });

    return { result, pointsGenerated, rankingBefore, rankingAfter, summary };
  }

  private calculateTeamPoints(params: {
    rules: any[];
    phase: any;
    isWinner: boolean;
    isDraw: boolean;
    cleanSheet: boolean;
    isThrashing: boolean;
    advancing: boolean;
  }): Array<{ points: number; reason: string; eventType: string }> {
    const { rules, phase, isWinner, isDraw, cleanSheet, isThrashing } = params;
    const results: Array<{ points: number; reason: string; eventType: string }> = [];

    const getPoints = (eventType: string) =>
      rules.find(r => r.eventType === eventType)?.points || 0;

    // Victoria o empate en fase de grupos
    if (phase.type === 'GROUP_STAGE') {
      if (isWinner) {
        const pts = getPoints('WIN_GROUP');
        results.push({ points: pts, reason: `Victoria en fase de grupos (+${pts})`, eventType: 'WIN_GROUP' });
      } else if (isDraw) {
        const pts = getPoints('DRAW_GROUP');
        results.push({ points: pts, reason: `Empate en fase de grupos (+${pts})`, eventType: 'DRAW_GROUP' });
      }
    }

    // Ambos equipos reciben puntos por ESTAR en esta fase eliminatoria
    const arrivalMap: Record<string, string> = {
      ROUND_OF_32:   'ADVANCE_ROUND_OF_32',  // llegar a 16avos — ambos
      ROUND_OF_16:   'ADVANCE_ROUND_OF_16',  // llegar a octavos — ambos
      QUARTER_FINAL: 'ADVANCE_QUARTER',       // llegar a cuartos — ambos
      SEMI_FINAL:    'ADVANCE_SEMI',          // llegar a semifinal — ambos
      FINAL:         'REACH_FINAL',           // llegar a final — ambos
    };

    if (arrivalMap[phase.type]) {
      const eventType = arrivalMap[phase.type];
      const pts = getPoints(eventType);
      if (pts > 0) results.push({ points: pts, reason: `Llegar a ${phase.name} (+${pts})`, eventType });
    }

    // Tercer lugar — solo al ganador del partido
    if (phase.type === 'THIRD_PLACE' && isWinner) {
      const pts = getPoints('THIRD_PLACE');
      if (pts > 0) results.push({ points: pts, reason: `Tercer lugar (+${pts})`, eventType: 'THIRD_PLACE' });
    }

    // Campeón — solo al ganador de la final
    if (phase.type === 'FINAL' && isWinner) {
      const pts = getPoints('CHAMPION');
      if (pts > 0) results.push({ points: pts, reason: `¡Campeón! (+${pts})`, eventType: 'CHAMPION' });
    }

    // Subcampeón — al perdedor de la final
    if (phase.type === 'FINAL' && !isWinner && !isDraw) {
      const pts = getPoints('RUNNER_UP');
      if (pts > 0) results.push({ points: pts, reason: `Subcampeón (+${pts})`, eventType: 'RUNNER_UP' });
    }

    // Bonificaciones extra
    if (cleanSheet && (isWinner || isDraw)) {
      const pts = getPoints('CLEAN_SHEET');
      if (pts > 0) results.push({ points: pts, reason: `Portería en cero (+${pts})`, eventType: 'CLEAN_SHEET' });
    }
    if (isThrashing) {
      const pts = getPoints('THRASHING_WIN');
      if (pts > 0) results.push({ points: pts, reason: `Goleada por 3+ goles (+${pts})`, eventType: 'THRASHING_WIN' });
    }

    return results;
  }

  private async updateTeamStats(match: any, data: MatchResultData, homeWon: boolean, awayWon: boolean, isDraw: boolean, homeClean: boolean, awayClean: boolean, isThrashing: boolean) {
    const homeUpdate = {
      matchesPlayed: { increment: 1 },
      goalsFor: { increment: data.homeGoals },
      goalsAgainst: { increment: data.awayGoals },
      ...(homeWon ? { wins: { increment: 1 } } : {}),
      ...(awayWon ? { losses: { increment: 1 } } : {}),
      ...(isDraw ? { draws: { increment: 1 } } : {}),
      ...(homeClean ? { cleanSheets: { increment: 1 } } : {}),
      ...(isThrashing && homeWon ? { thrashings: { increment: 1 } } : {}),
    };
    const awayUpdate = {
      matchesPlayed: { increment: 1 },
      goalsFor: { increment: data.awayGoals },
      goalsAgainst: { increment: data.homeGoals },
      ...(awayWon ? { wins: { increment: 1 } } : {}),
      ...(homeWon ? { losses: { increment: 1 } } : {}),
      ...(isDraw ? { draws: { increment: 1 } } : {}),
      ...(awayClean ? { cleanSheets: { increment: 1 } } : {}),
      ...(isThrashing && awayWon ? { thrashings: { increment: 1 } } : {}),
    };

    await Promise.all([
      this.prisma.team.update({ where: { id: match.homeTeamId }, data: homeUpdate }),
      this.prisma.team.update({ where: { id: match.awayTeamId }, data: awayUpdate }),
    ]);
  }

  private generateSummary(match: any, data: MatchResultData, points: any[], before: any[], after: any[]): string {
    const totalByParticipant = new Map<string, number>();
    for (const p of points) {
      totalByParticipant.set(p.participantId, (totalByParticipant.get(p.participantId) || 0) + p.points);
    }

    const lines: string[] = [`${match.homeTeam.name} ${data.homeGoals} - ${data.awayGoals} ${match.awayTeam.name}.`];

    for (const [participantId, total] of totalByParticipant) {
      const participant = after.find(r => r.participantId === participantId);
      const beforeRank = before.find(r => r.participantId === participantId)?.rank;
      const afterRank = participant?.rank;
      if (!participant) continue;

      lines.push(
        `${participant.participantName} suma ${total} puntos${beforeRank !== afterRank ? ` y ${afterRank < beforeRank ? 'sube' : 'baja'} al lugar ${afterRank}` : ''}.`
      );
    }

    return lines.join(' ');
  }
}