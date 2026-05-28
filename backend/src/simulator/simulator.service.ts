// src/simulator/simulator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SimulationScenario {
  participantId: string;
  participantName: string;
  currentPoints: number;
  maxPossiblePoints: number;
  bestCaseRank: number;
  aliveTeams: number;
  canOvertake: Array<{ targetName: string; pointsNeeded: number; feasible: boolean }>;
  criticalTeams: Array<{ teamName: string; pointsIfChampion: number }>;
}

@Injectable()
export class SimulatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula el mejor escenario posible para cada participante.
   */
  async simulate(tournamentId: string): Promise<SimulationScenario[]> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: {
        teams: { where: { status: 'ACTIVE' } },
      },
    });

    const rules = await this.prisma.scoringRule.findMany({
      where: { tournamentId, isActive: true },
    });

    const getPoints = (eventType: string) =>
      rules.find(r => r.eventType === eventType)?.points || 0;

    // Puntos máximos restantes por equipo vivo (si llega a campeón)
    const maxPointsIfChampion =
      getPoints('WIN_GROUP') * 3 +
      getPoints('ADVANCE_ROUND_OF_32') +
      getPoints('ADVANCE_ROUND_OF_16') +
      getPoints('ADVANCE_QUARTER') +
      getPoints('ADVANCE_SEMI') +
      getPoints('REACH_FINAL') +
      getPoints('CHAMPION') +
      getPoints('CLEAN_SHEET') * 4 +
      getPoints('THRASHING_WIN') * 2;

    const allParticipants = await this.prisma.participant.findMany({
      where: { tournamentId },
    });

    const scenarios: SimulationScenario[] = [];

    for (const p of participants) {
      const maxPossible = p.totalPoints + p.teams.length * maxPointsIfChampion;

      const canOvertake = allParticipants
        .filter(other => other.id !== p.id && other.totalPoints > p.totalPoints)
        .map(other => ({
          targetName: other.alias || other.name,
          pointsNeeded: other.totalPoints - p.totalPoints + 1,
          feasible: maxPossible > other.totalPoints,
        }));

      const criticalTeams = p.teams.map(team => ({
        teamName: team.name,
        pointsIfChampion: maxPointsIfChampion,
      }));

      // Ranking hipotético si todo sale bien
      const hypotheticalPoints = maxPossible;
      const bestCaseRank = allParticipants.filter(
        other => other.id !== p.id && other.totalPoints + (other.currentRank <= p.currentRank ? 10 : 0) >= hypotheticalPoints
      ).length + 1;

      scenarios.push({
        participantId: p.id,
        participantName: p.alias || p.name,
        currentPoints: p.totalPoints,
        maxPossiblePoints: maxPossible,
        bestCaseRank,
        aliveTeams: p.teams.length,
        canOvertake,
        criticalTeams,
      });
    }

    return scenarios.sort((a, b) => b.currentPoints - a.currentPoints);
  }

  /**
   * Simula qué pasa si un equipo específico gana (hipotéticamente).
   */
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

    const pointsGained = getPoints('ADVANCE_QUARTER') + getPoints('ADVANCE_SEMI') +
      getPoints('REACH_FINAL') + getPoints('CHAMPION');

    const participant = team.participant;
    if (!participant) return { team, ownerName: 'Sin dueño', pointsGained: 0, newOwnerRank: 0, message: 'Este equipo no tiene dueño asignado.' };

    const hypotheticalTotal = participant.totalPoints + pointsGained;
    const allParticipants = await this.prisma.participant.findMany({ where: { tournamentId } });
    const newRank = allParticipants.filter(p => p.totalPoints > hypotheticalTotal).length + 1;

    return {
      team,
      ownerName: participant.alias || participant.name,
      pointsGained,
      newOwnerRank: newRank,
      message: `Si ${team.name} se corona campeón, ${participant.alias || participant.name} ganaría ${pointsGained} puntos y quedaría en el lugar ${newRank}.`,
    };
  }
}
