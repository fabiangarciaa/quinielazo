import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportRankingExcel(tournamentId: string): Promise<Buffer> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
      orderBy: { currentRank: 'asc' },
    });

    const rows = participants.map(p => ({
      Posición: p.currentRank,
      Participante: p.alias || p.name,
      Puntos: p.totalPoints,
      'Equipos vivos': p.teams.filter(t => t.status === 'ACTIVE').length,
      'Equipos eliminados': p.teams.filter(t => t.status === 'ELIMINATED').length,
      Equipos: p.teams.map(t => t.name).join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportRankingCsv(tournamentId: string): Promise<string> {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { teams: true },
      orderBy: { currentRank: 'asc' },
    });
    const header = 'Posición,Participante,Puntos,Equipos vivos,Equipos eliminados\n';
    const rows = participants.map(p =>
      `${p.currentRank},"${p.alias || p.name}",${p.totalPoints},${p.teams.filter(t=>t.status==='ACTIVE').length},${p.teams.filter(t=>t.status==='ELIMINATED').length}`
    ).join('\n');
    return header + rows;
  }
}
