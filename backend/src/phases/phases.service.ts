import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PhasesService {
  constructor(private prisma: PrismaService) {}

  findByTournament(tournamentId: string) {
    return this.prisma.tournamentPhase.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: 'asc' },
      include: { _count: { select: { matches: true } } },
    });
  }

  create(data: { tournamentId: string; name: string; type: any; roundNumber: number; startDate?: string }) {
    return this.prisma.tournamentPhase.create({
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined },
    });
  }

  update(id: string, data: { name?: string; isActive?: boolean; startDate?: string }) {
    return this.prisma.tournamentPhase.update({
      where: { id },
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined },
    });
  }

  async setActive(id: string) {
    const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({ where: { id } });
    await this.prisma.tournamentPhase.updateMany({ where: { tournamentId: phase.tournamentId }, data: { isActive: false } });
    return this.prisma.tournamentPhase.update({ where: { id }, data: { isActive: true } });
  }

  delete(id: string) {
    return this.prisma.tournamentPhase.delete({ where: { id } });
  }

  async closePhase(phaseId: string, advancingTeamIds: string[]) {
    const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({
      where: { id: phaseId },
      include: { matches: { include: { homeTeam: true, awayTeam: true } } },
    });

    const teamIdsInPhase = new Set<string>();
    for (const match of phase.matches) {
      teamIdsInPhase.add(match.homeTeamId);
      teamIdsInPhase.add(match.awayTeamId);
    }

    let teamIds = [...teamIdsInPhase];
    if (teamIds.length === 0) {
      const allTeams = await this.prisma.team.findMany({
        where: { tournamentId: phase.tournamentId, status: 'ACTIVE' },
        select: { id: true },
      });
      teamIds = allTeams.map(t => t.id);
    }

    const eliminatedIds = teamIds.filter(id => !advancingTeamIds.includes(id));

   await this.prisma.team.updateMany({
      where: { id: { in: eliminatedIds } },
      data: { status: 'ELIMINATED' },
    });

    if (advancingTeamIds.length > 0) {
      await this.prisma.team.updateMany({
        where: { id: { in: advancingTeamIds } },
        data: { status: 'ACTIVE' },
      });
    }

    await this.prisma.tournamentPhase.update({ where: { id: phaseId }, data: { isActive: false } });

    // Activar siguiente fase automáticamente
    const nextPhase = await this.prisma.tournamentPhase.findFirst({
      where: { tournamentId: phase.tournamentId, roundNumber: phase.roundNumber + 1 },
    });
    if (nextPhase) {
      await this.prisma.tournamentPhase.update({ where: { id: nextPhase.id }, data: { isActive: true } });
    }

    return {
      phaseId,
      phaseName: phase.name,
      eliminated: eliminatedIds.length,
      advancing: advancingTeamIds.length,
      message: `${advancingTeamIds.length} equipos clasifican, ${eliminatedIds.length} eliminados.`,
    };
  }

  async getTeamsInPhase(phaseId: string) {
    const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({
      where: { id: phaseId },
      include: {
        matches: {
          include: {
            homeTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
            awayTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
          },
        },
      },
    });

    const teamsMap = new Map<string, any>();
    for (const match of phase.matches) {
      if (!teamsMap.has(match.homeTeamId)) teamsMap.set(match.homeTeamId, match.homeTeam);
      if (!teamsMap.has(match.awayTeamId)) teamsMap.set(match.awayTeamId, match.awayTeam);
    }

    if (teamsMap.size === 0) {
      return this.prisma.team.findMany({
        where: { tournamentId: phase.tournamentId, status: 'ACTIVE' },
        include: { participant: { select: { id: true, name: true, alias: true } } },
        orderBy: { strength: 'desc' },
      });
    }

    return [...teamsMap.values()].sort((a, b) => b.strength - a.strength);
  }
}
