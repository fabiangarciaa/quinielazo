// src/draws/draws.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DrawAssignment {
  participantId: string;
  participantName: string;
  teams: Array<{ id: string; name: string; strength: number; potName: string }>;
  totalStrength: number;
}

export interface DrawResult {
  assignments: DrawAssignment[];
  balanceScore: number;
  balanceLabel: 'Muy equilibrado' | 'Medianamente equilibrado' | 'Desbalanceado';
  strengthStats: { min: number; max: number; avg: number; stdDev: number };
}

@Injectable()
export class DrawsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ejecuta el sorteo por bombos. Cada participante recibe 1 equipo de cada bombo.
   */
  async executePotsDrawl(tournamentId: string): Promise<DrawResult> {
    const [participants, pots] = await Promise.all([
      this.prisma.participant.findMany({ where: { tournamentId } }),
      this.prisma.pot.findMany({
        where: { tournamentId },
        include: { teams: true },
        orderBy: { level: 'asc' },
      }),
    ]);

    if (participants.length === 0) throw new BadRequestException('No hay participantes');
    if (pots.length === 0) throw new BadRequestException('No hay bombos configurados');

    const assignments: Map<string, string[]> = new Map(participants.map(p => [p.id, []]));

    for (const pot of pots) {
      const teams = this.shuffle([...pot.teams]);
      participants.forEach((participant, idx) => {
        const team = teams[idx % teams.length];
        if (team) assignments.get(participant.id)!.push(team.id);
      });
    }

    return this.applyAndSaveAssignments(tournamentId, assignments, 'POTS');
  }

  /**
   * Sorteo en serpiente (snake draft). Equilibra el orden de selección.
   */
  async executeSnakeDraft(tournamentId: string, roundsPerParticipant = 8): Promise<DrawResult> {
    const [participants, teams] = await Promise.all([
      this.prisma.participant.findMany({ where: { tournamentId } }),
      this.prisma.team.findMany({
          where: { tournamentId },
          orderBy: { strength: 'desc' },
        }),
    ]);

    const assignments: Map<string, string[]> = new Map(participants.map(p => [p.id, []]));
    const availableTeams = [...teams];
    let pickOrder = [...participants.map(p => p.id)];

    for (let round = 0; round < roundsPerParticipant; round++) {
      const order = round % 2 === 0 ? pickOrder : [...pickOrder].reverse();
      for (const participantId of order) {
        if (availableTeams.length === 0) break;
        const team = availableTeams.shift()!;
        assignments.get(participantId)!.push(team.id);
      }
    }

    return this.applyAndSaveAssignments(tournamentId, assignments, 'SNAKE_DRAFT');
  }

  /**
   * Sorteo balanceado automático — minimiza la diferencia de fuerza total entre participantes.
   */
  async executeBalancedAuto(tournamentId: string, teamsPerParticipant: number): Promise<DrawResult> {
    const [participants, teams] = await Promise.all([
      this.prisma.participant.findMany({ where: { tournamentId } }),
      this.prisma.team.findMany({
        where: { tournamentId },
        orderBy: { strength: 'desc' },
      }),
    ]);

    const assignments: Map<string, string[]> = new Map(participants.map(p => [p.id, []]));
    const strengthTotals: Map<string, number> = new Map(participants.map(p => [p.id, 0]));
    const shuffledTeams = this.shuffle([...teams]);

    for (const team of shuffledTeams) {
      if ([...assignments.values()].every(arr => arr.length >= teamsPerParticipant)) break;

      // Asignar al participante con menos fuerza acumulada que aún no tiene suficientes equipos
      const eligibleParticipants = participants.filter(
        p => assignments.get(p.id)!.length < teamsPerParticipant
      );
      eligibleParticipants.sort(
        (a, b) => strengthTotals.get(a.id)! - strengthTotals.get(b.id)!
      );

      const target = eligibleParticipants[0];
      if (!target) continue;
      assignments.get(target.id)!.push(team.id);
      strengthTotals.set(target.id, strengthTotals.get(target.id)! + team.strength);
    }

    return this.applyAndSaveAssignments(tournamentId, assignments, 'BALANCED_AUTO');
  }

  /**
   * Calcula la propuesta de bombos automática según equipos y participantes.
   */
  async calculatePotProposal(tournamentId: string): Promise<{
    pots: Array<{ level: number; name: string; strengthMin: number; strengthMax: number; teams: any[] }>;
    teamsPerParticipant: number;
  }> {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
    const teams = await this.prisma.team.findMany({
      where: { tournamentId },
      orderBy: { strength: 'desc' },
    });

    const numPots = tournament.participantCount;
    const teamsPerPot = Math.floor(teams.length / numPots);
    const teamsPerParticipant = numPots;

    const pots = [];
    for (let i = 0; i < numPots; i++) {
      const slice = teams.slice(i * teamsPerPot, (i + 1) * teamsPerPot);
      pots.push({
        level: i + 1,
        name: `Bombo ${i + 1}`,
        strengthMin: Math.min(...slice.map(t => t.strength)),
        strengthMax: Math.max(...slice.map(t => t.strength)),
        teams: slice,
      });
    }

    return { pots, teamsPerParticipant };
  }

  private async applyAndSaveAssignments(
    tournamentId: string,
    assignments: Map<string, string[]>,
    method: string,
  ): Promise<DrawResult> {
    // Limpiar asignaciones previas
    await this.prisma.team.updateMany({
      where: { tournamentId },
      data: { participantId: null },
    });

    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
    });

    // Aplicar asignaciones en BD
    for (const [participantId, teamIds] of assignments) {
      await this.prisma.team.updateMany({
        where: { id: { in: teamIds } },
        data: { participantId },
      });
    }

    // Construir resultado con datos reales
    const teams = await this.prisma.team.findMany({
      where: { tournamentId, participantId: { not: null } },
      include: { pot: true },
    });

    const drawAssignments: DrawAssignment[] = [];
    for (const [participantId, teamIds] of assignments) {
      const participant = participants.find(p => p.id === participantId)!;
      const assignedTeams = teams
        .filter(t => teamIds.includes(t.id))
        .map(t => ({ id: t.id, name: t.name, strength: t.strength, potName: t.pot?.name || 'Sin bombo' }));

      drawAssignments.push({
        participantId,
        participantName: participant.alias || participant.name,
        teams: assignedTeams,
        totalStrength: assignedTeams.reduce((acc, t) => acc + t.strength, 0),
      });
    }

    // Calcular balance
    const strengths = drawAssignments.map(a => a.totalStrength);
    const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
    const stdDev = Math.sqrt(strengths.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / strengths.length);
    const balanceScore = Math.max(0, 100 - (stdDev / avg) * 100);

    const balanceLabel =
      balanceScore >= 80 ? 'Muy equilibrado' :
      balanceScore >= 50 ? 'Medianamente equilibrado' : 'Desbalanceado';

    // Guardar draw en BD
    await this.prisma.draw.create({
      data: {
        tournamentId,
        method: method as any,
        status: 'COMPLETED',
        balanceScore,
        assignments: JSON.parse(JSON.stringify(drawAssignments)),
        executedAt: new Date(),
      },
    });

    return {
      assignments: drawAssignments,
      balanceScore,
      balanceLabel,
      strengthStats: { min: Math.min(...strengths), max: Math.max(...strengths), avg, stdDev },
    };
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async resetDraw(tournamentId: string): Promise<void> {
    await this.prisma.team.updateMany({
      where: { tournamentId },
      data: { participantId: null },
    });
    await this.prisma.draw.deleteMany({ where: { tournamentId } });
  }
}
