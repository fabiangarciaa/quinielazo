import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PotsService {
  constructor(private prisma: PrismaService) {}

  findByTournament(tournamentId: string) {
    return this.prisma.pot.findMany({
      where: { tournamentId },
      include: {
        teams: {
          include: { participant: { select: { id: true, name: true, alias: true } } },
          orderBy: { strength: 'desc' },
        },
      },
      orderBy: { level: 'asc' },
    });
  }

  create(data: { tournamentId: string; name: string; level: number; strengthMin: number; strengthMax: number; teamsPerParticipant: number }) {
    return this.prisma.pot.create({ data, include: { teams: true } });
  }

  update(id: string, data: any) {
    return this.prisma.pot.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.pot.delete({ where: { id } });
  }

  async autoAssignTeamsToPots(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
    const teams = await this.prisma.team.findMany({ where: { tournamentId }, orderBy: { strength: 'desc' } });

    if (teams.length === 0) return { message: 'No hay equipos en este torneo.' };

    const numParticipants = tournament.participantCount;
    const totalTeams = teams.length;
    const teamsPerPot = numParticipants;
    const numPots = Math.floor(totalTeams / teamsPerPot);

    // Limpiar bombos existentes
    await this.prisma.team.updateMany({ where: { tournamentId }, data: { potId: null } });
    await this.prisma.pot.deleteMany({ where: { tournamentId } });

    let teamIndex = 0;
    for (let i = 0; i < numPots; i++) {
      const slice = teams.slice(teamIndex, teamIndex + teamsPerPot);
      teamIndex += teamsPerPot;
      if (slice.length === 0) break;

      const strengths = slice.map(t => t.strength);
      const pot = await this.prisma.pot.create({
        data: {
          tournamentId,
          name: `Bombo ${i + 1}`,
          level: i + 1,
          strengthMin: Math.min(...strengths),
          strengthMax: Math.max(...strengths),
          teamsPerParticipant: 1,
        },
      });

      await this.prisma.team.updateMany({
        where: { id: { in: slice.map(t => t.id) } },
        data: { potId: pot.id },
      });
    }

    const potsCreated = await this.prisma.pot.count({ where: { tournamentId } });
    const teamsAssigned = await this.prisma.team.count({ where: { tournamentId, potId: { not: null } } });

    return {
      message: `Se crearon ${potsCreated} bombos con ${teamsAssigned} equipos distribuidos por fuerza (ranking general).`,
      potsCreated,
      teamsAssigned,
      teamsPerPot,
      numPots,
    };
  }
}
