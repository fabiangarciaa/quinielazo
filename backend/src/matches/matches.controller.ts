import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Matches') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('matches')
export class MatchesController {
  constructor(private svc: MatchesService) {}
  @Get() findAll(@Query('tournamentId') tid: string, @Query('phaseId') pid?: string) { return this.svc.findByTournament(tid, pid); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Post('bulk') createBulk(@Body() body: {tournamentId:string; phaseId:string; matchups:any[]}) {
    return this.svc.createBulk(body.tournamentId, body.phaseId, body.matchups);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Post(':id/result') recordResult(@Param('id') id: string, @Body() body: any) { return this.svc.recordResult(id, body); }
  @Post(':id/correct') correctResult(@Param('id') id: string, @Body() body: any) { return this.svc.correctResult(id, body); }
  @Delete(':id/result') deleteResult(@Param('id') id: string) { return this.svc.deleteResult(id); }
}
