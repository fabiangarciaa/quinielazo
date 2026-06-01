import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DrawsService } from './draws.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Draws') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('draws')
export class DrawsController {
  constructor(private svc: DrawsService, private prisma: PrismaService) {}
  @Get() findAll(@Query('tournamentId') tid: string) {
    return this.prisma.draw.findMany({ where:{tournamentId:tid}, orderBy:{createdAt:'desc'} });
  }
  @Post(':tournamentId/proposal') proposal(@Param('tournamentId') tid: string) { return this.svc.calculatePotProposal(tid); }
  @Post(':tournamentId/pots') pots(@Param('tournamentId') tid: string) { return this.svc.executePotsDrawl(tid); }
  @Post(':tournamentId/snake') snake(@Param('tournamentId') tid: string) { return this.svc.executeSnakeDraft(tid); }
  @Post(':tournamentId/balanced') balanced(@Param('tournamentId') tid: string, @Body() body:{teamsPerParticipant:number}) {
    return this.svc.executeBalancedAuto(tid, body.teamsPerParticipant);
  }
  @Delete(':tournamentId/reset') reset(@Param('tournamentId') tid: string) {
    return this.svc.resetDraw(tid);
  }
}
