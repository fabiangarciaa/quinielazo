import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tournament.findMany({
      include: { _count: { select: { participants: true, teams: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.tournament.findUniqueOrThrow({
      where: { id },
      include: {
        participants: { include: { teams: true } },
        phases: { orderBy: { roundNumber: 'asc' } },
        scoringRules: { where: { isActive: true } },
        _count: { select: { teams: true } },
      },
    });
  }

  create(data: { name: string; type: any; season: string; teamCount: number; participantCount: number; competitionSystem: string; scoringConfig?: any }) {
    return this.prisma.tournament.create({ data: { ...data, scoringConfig: data.scoringConfig || {} } });
  }

  update(id: string, data: any) {
    return this.prisma.tournament.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string) {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id } });
    const allowed: Record<string, string[]> = {
      SETUP: ['DRAW_PENDING'],
      DRAW_PENDING: ['SETUP', 'IN_PROGRESS'],
      IN_PROGRESS: ['FINISHED'],
      FINISHED: [],
    };
    if (!allowed[tournament.status]?.includes(status)) {
      throw new BadRequestException(`No se puede cambiar de ${tournament.status} a ${status}`);
    }
    return this.prisma.tournament.update({ where: { id }, data: { status: status as any } });
  }

  async delete(id: string) {
    const t = await this.prisma.tournament.findUniqueOrThrow({ where: { id } });
    if (t.status === 'IN_PROGRESS') throw new BadRequestException('No se puede eliminar un torneo en curso');
    return this.prisma.tournament.delete({ where: { id } });
  }

  getScoringRules(tournamentId: string) {
    return this.prisma.scoringRule.findMany({ where: { tournamentId }, orderBy: { eventType: 'asc' } });
  }

  updateScoringRule(ruleId: string, points: number, isActive: boolean) {
    return this.prisma.scoringRule.update({ where: { id: ruleId }, data: { points, isActive } });
  }

  async upsertScoringRule(tournamentId: string, eventType: string, points: number, description?: string) {
    return this.prisma.scoringRule.upsert({
      where: { tournamentId_eventType: { tournamentId, eventType: eventType as any } },
      update: { points, description },
      create: { tournamentId, eventType: eventType as any, points, isActive: true, description },
    });
  }
}
