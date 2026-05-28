import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}
  findByTournament(tournamentId: string) {
    return this.prisma.result.findMany({
      where: { match: { tournamentId } },
      include: { match: { include: { homeTeam: { include: { participant: true } }, awayTeam: { include: { participant: true } }, phase: true } } },
      orderBy: { recordedAt: 'desc' },
    });
  }
  getImpact(resultId: string) {
    return this.prisma.participantScore.findMany({
      where: { resultId },
      include: { participant: true },
    });
  }
}
