import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Export') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('export')
export class ExportController {
  constructor(private svc: ExportService) {}

  @Get(':tournamentId/ranking')
  async exportRanking(@Param('tournamentId') tid: string, @Query('format') fmt: string, @Res() res: Response) {
    if (fmt === 'excel') {
      const buf = await this.svc.exportRankingExcel(tid);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=ranking.xlsx' });
      res.send(buf);
    } else {
      const csv = await this.svc.exportRankingCsv(tid);
      res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=ranking.csv' });
      res.send(csv);
    }
  }
}
