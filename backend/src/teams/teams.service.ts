// src/teams/teams.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  findByTournament(tournamentId: string) {
    return this.prisma.team.findMany({
      where: { tournamentId },
      include: { participant: { select: { id: true, name: true, alias: true } }, pot: true },
      orderBy: [{ status: 'asc' }, { strength: 'desc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.team.findUniqueOrThrow({
      where: { id },
      include: {
        participant: true,
        pot: true,
        scores: { orderBy: { earnedAt: 'desc' } },
        homeMatches: { include: { result: true, phase: true } },
        awayMatches: { include: { result: true, phase: true } },
      },
    });
  }

  create(data: { tournamentId: string; name: string; country?: string; strength?: number; potId?: string }) {
    return this.prisma.team.create({ data, include: { pot: true } });
  }

  update(id: string, data: { name?: string; country?: string; strength?: number; potId?: string; status?: any; phaseReached?: string }) {
    return this.prisma.team.update({ where: { id }, data });
  }

  async assignToParticipant(teamId: string, participantId: string | null) {
    return this.prisma.team.update({ where: { id: teamId }, data: { participantId } });
  }

  delete(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }

  async importFromCsv(tournamentId: string, csvContent: string) {
    const lines = csvContent.trim().split('\n').slice(1); // skip header
    const created = [];
    for (const line of lines) {
      const [name, country, strength] = line.split(',').map(s => s.trim().replace(/"/g, ''));
      if (!name) continue;
      try {
        const team = await this.prisma.team.create({
          data: { tournamentId, name, country: country || '', strength: parseInt(strength) || 50 },
        });
        created.push(team);
      } catch (_) { /* skip duplicates */ }
    }
    return { imported: created.length, teams: created };
  }
}
