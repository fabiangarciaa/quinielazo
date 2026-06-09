// src/simulator/simulator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KeyMatch {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  myTeamName: string;
  rivalParticipantName: string;
  pointsIfWin: number;
  positionsGained: number;
  phaseName: string;
}

export interface SimulationScenario {
  participantId: string;
  participantName: string;
  currentPoints: number;
  rank: number;
  aliveTeams: number;
  diffWithLeader: number;
  diffWithNext: number;
  keyMatch: KeyMatch | null;
}

@Injectable()
export class SimulatorService {
  constructor(private prisma: PrismaService) {}

  async simulate(tournamentId: string): Promise<SimulationScenario[]> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
    });

    const rules = await this.prisma.scoringRule.findMany({
      where: { tournamentId, isActive: true },
    });

    const getPoints = (eventType: string) =>
      rules.find(r => r.eventType === eventType)?.points || 0;

    const ROUND_ROBIN_PHASES = ['GROUP_STAGE', 'REGULAR_SEASON'];

    // Obtener partidos pendientes con equipos y participantes
    const pendingMatches = await this.prisma.match.findMany({
      where: { tournamentId, status: 'SCHEDULED' },
      include: {
        homeTeam: { include: { participant: true } },
        awayTeam: { include: { participant: true } },
        phase: true,
      },
    });

    const allParticipants = await this.prisma.participant.findMany({
      where: { tournamentId },
      orderBy: { currentRank: 'asc' },
    });

    const leader = allParticipants[0];

    const scenarios: SimulationScenario[] = [];

    for (const p of participants) {
      const aliveTeams = p.teams.filter(t => t.status === 'ACTIVE');
      const myTeamIds = new Set(aliveTeams.map(t => t.id));

      // Diferencia con el líder
      const diffWithLeader = leader.id === p.id ? 0 : leader.totalPoints - p.totalPoints;

      // Diferencia con el de arriba
      const above = allParticipants.find(other =>
        other.id !== p.id && other.currentRank === p.currentRank - 1
      );
      const diffWithNext = above ? above.totalPoints - p.totalPoints : 0;

      // Encontrar partido clave
      let keyMatch: KeyMatch | null = null;
      let bestPositionsGained = 0;

      for (const match of pendingMatches) {
        const isHome = myTeamIds.has(match.homeTeamId);
        const isAway = myTeamIds.has(match.awayTeamId);
        if (!isHome && !isAway) continue;

        const myTeam = isHome ? match.homeTeam : match.awayTeam;
        const rivalTeam = isHome ? match.awayTeam : match.homeTeam;

        // Solo importa si el rival pertenece a alguien que está arriba de mí
        if (!rivalTeam.participantId) continue;
        const rivalParticipant = allParticipants.find(ap => ap.id === rivalTeam.participantId);
        if (!rivalParticipant || rivalParticipant.currentRank >= p.currentRank) continue;

        // Calcular puntos que ganaría si mi equipo gana
        let pointsIfWin = 0;
        const isElimination = !ROUND_ROBIN_PHASES.includes(match.phase.type);

        if (!isElimination) {
          pointsIfWin += getPoints('WIN_GROUP');
        } else {
          // En eliminatorias ambos reciben puntos por llegar
          const arrivalMap: Record<string, string> = {
            ROUND_OF_32:   'ADVANCE_ROUND_OF_32',
            ROUND_OF_16:   'ADVANCE_ROUND_OF_16',
            QUARTER_FINAL: 'ADVANCE_QUARTER',
            SEMI_FINAL:    'ADVANCE_SEMI',
            FINAL:         'REACH_FINAL',
          };
          if (arrivalMap[match.phase.type]) {
            pointsIfWin += getPoints(arrivalMap[match.phase.type]);
          }
        }

        // Simular posiciones ganadas
        const mySimPoints = p.totalPoints + pointsIfWin;
        const newRank = allParticipants.filter(
          other => other.id !== p.id && other.totalPoints > mySimPoints
        ).length + 1;
        const positionsGained = p.currentRank - newRank;

        if (positionsGained > bestPositionsGained) {
          bestPositionsGained = positionsGained;
          keyMatch = {
            matchId: match.id,
            homeTeamName: match.homeTeam.name,
            awayTeamName: match.awayTeam.name,
            myTeamName: myTeam.name,
            rivalParticipantName: rivalParticipant.alias || rivalParticipant.name,
            pointsIfWin,
            positionsGained,
            phaseName: match.phase.name,
          };
        }
      }

      scenarios.push({
        participantId: p.id,
        participantName: p.alias || p.name,
        currentPoints: p.totalPoints,
        rank: p.currentRank,
        aliveTeams: aliveTeams.length,
        diffWithLeader,
        diffWithNext,
        keyMatch,
      });
    }

    return scenarios.sort((a, b) => a.rank - b.rank);
  }

  async simulateTeamWin(tournamentId: string, teamId: string): Promise<{
    team: any;
    ownerName: string;
    pointsGained: number;
    newOwnerRank: number;
    message: string;
  }> {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      include: { participant: true },
    });

    const rules = await this.prisma.scoringRule.findMany({
      where: { tournamentId, isActive: true },
    });
    const getPoints = (e: string) => rules.find(r => r.eventType === e)?.points || 0;

    const phases = await this.prisma.tournamentPhase.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: 'asc' },
    });
    const activePhase = phases.find(p => p.isActive);
    const phaseOrder = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
    const currentIdx = phaseOrder.indexOf(activePhase?.type || 'GROUP_STAGE');

    const phasePointsMap: Record<string, string> = {
      ROUND_OF_32:   'ADVANCE_ROUND_OF_32',
      ROUND_OF_16:   'ADVANCE_ROUND_OF_16',
      QUARTER_FINAL: 'ADVANCE_QUARTER',
      SEMI_FINAL:    'ADVANCE_SEMI',
      FINAL:         'REACH_FINAL',
    };

    let pointsGained = 0;
    for (let i = currentIdx; i < phaseOrder.length; i++) {
      const key = phasePointsMap[phaseOrder[i]];
      if (key) pointsGained += getPoints(key);
    }
    pointsGained += getPoints('CHAMPION');

    const participant = team.participant;
    if (!participant) return {
      team, ownerName: 'Sin dueño', pointsGained: 0, newOwnerRank: 0,
      message: 'Este equipo no tiene dueño asignado.'
    };

    const hypotheticalTotal = participant.totalPoints + pointsGained;
    const allParticipants = await this.prisma.participant.findMany({ where: { tournamentId } });
    const newRank = allParticipants.filter(p => p.totalPoints > hypotheticalTotal).length + 1;

    return {
      team,
      ownerName: participant.alias || participant.name,
      pointsGained,
      newOwnerRank: newRank,
      message: `Si ${team.name} se corona campeón, ${participant.alias || participant.name} ganaría ${pointsGained} puntos adicionales y quedaría en el lugar #${newRank}.`,
    };
  }

  async simulateMatch(tournamentId: string, matchId: string, homeGoals: number, awayGoals: number, advancingTeamId?: string): Promise<{
    ranking: Array<{ participantId: string; name: string; currentPoints: number; simulatedPoints: number; delta: number; rank: number; simulatedRank: number }>;
    pointsGenerated: Array<{ participantName: string; teamName: string; reason: string; points: number }>;
  }> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: { include: { participant: true } },
        awayTeam: { include: { participant: true } },
        phase: true,
      },
    });

    const rules = await this.prisma.scoringRule.findMany({
      where: { tournamentId, isActive: true },
    });

    const getPoints = (eventType: string) =>
      rules.find(r => r.eventType === eventType)?.points || 0;

    const goalDiff = Math.abs(homeGoals - awayGoals);
    const isThrashing = goalDiff >= 3;
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;
    const isDraw = homeGoals === awayGoals;
    const homeCleanSheet = awayGoals === 0;
    const awayCleanSheet = homeGoals === 0;

    const ROUND_ROBIN_PHASES = ['GROUP_STAGE', 'REGULAR_SEASON'];
    const isElimination = !ROUND_ROBIN_PHASES.includes(match.phase.type);

    const pointsGenerated: Array<{ participantId: string; participantName: string; teamName: string; reason: string; points: number }> = [];

    const arrivalMap: Record<string, string> = {
      ROUND_OF_32:   'ADVANCE_ROUND_OF_32',
      ROUND_OF_16:   'ADVANCE_ROUND_OF_16',
      QUARTER_FINAL: 'ADVANCE_QUARTER',
      SEMI_FINAL:    'ADVANCE_SEMI',
      FINAL:         'REACH_FINAL',
    };

    for (const [teamId, isWinner, isHome] of [
      [match.homeTeamId, homeWon, true],
      [match.awayTeamId, awayWon, false],
    ] as [string, boolean, boolean][]) {
      const team = isHome ? match.homeTeam : match.awayTeam;
      if (!team.participantId || !team.participant) continue;

      const participantName = team.participant.alias || team.participant.name;
      const cleanSheet = isHome ? homeCleanSheet : awayCleanSheet;

      if (!isElimination) {
        if (isWinner) {
          const pts = getPoints('WIN_GROUP');
          if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Victoria en grupos`, points: pts });
        } else if (isDraw) {
          const pts = getPoints('DRAW_GROUP');
          if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Empate en grupos`, points: pts });
        }
      }

      if (isElimination && arrivalMap[match.phase.type]) {
        const pts = getPoints(arrivalMap[match.phase.type]);
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Llegar a ${match.phase.name}`, points: pts });
      }

      if (match.phase.type === 'THIRD_PLACE' && isWinner) {
        const pts = getPoints('THIRD_PLACE');
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Tercer lugar`, points: pts });
      }

      if (match.phase.type === 'FINAL' && isWinner) {
        const pts = getPoints('CHAMPION');
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `¡Campeón!`, points: pts });
      }

      if (match.phase.type === 'FINAL' && !isWinner && !isDraw) {
        const pts = getPoints('RUNNER_UP');
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Subcampeón`, points: pts });
      }

      if (cleanSheet && (isWinner || isDraw)) {
        const pts = getPoints('CLEAN_SHEET');
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Portería en cero`, points: pts });
      }

      if (isThrashing && isWinner) {
        const pts = getPoints('THRASHING_WIN');
        if (pts > 0) pointsGenerated.push({ participantId: team.participantId, participantName, teamName: team.name, reason: `Goleada`, points: pts });
      }
    }

    const allParticipants = await this.prisma.participant.findMany({ where: { tournamentId } });

    const deltaMap: Record<string, number> = {};
    for (const p of pointsGenerated) {
      deltaMap[p.participantId] = (deltaMap[p.participantId] || 0) + p.points;
    }

    const simulated = allParticipants.map(p => ({
      participantId: p.id,
      name: p.alias || p.name,
      currentPoints: p.totalPoints,
      simulatedPoints: p.totalPoints + (deltaMap[p.id] || 0),
      delta: deltaMap[p.id] || 0,
    }));

    simulated.sort((a, b) => b.simulatedPoints - a.simulatedPoints);
    const withRank = simulated.map((p, idx) => ({
      ...p,
      simulatedRank: idx + 1,
      rank: allParticipants.find(ap => ap.id === p.participantId)?.currentRank || 0,
    }));

    return {
      ranking: withRank,
      pointsGenerated: pointsGenerated.map(p => ({
        participantName: p.participantName,
        teamName: p.teamName,
        reason: p.reason,
        points: p.points,
      })),
    };
  }
}