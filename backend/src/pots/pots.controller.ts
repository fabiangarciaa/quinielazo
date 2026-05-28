import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PotsService } from './pots.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Pots') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('pots')
export class PotsController {
  constructor(private svc: PotsService) {}
  @Get() findAll(@Query('tournamentId') tid: string) { return this.svc.findByTournament(tid); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Post('auto-assign') autoAssign(@Body() body: {tournamentId: string}) { return this.svc.autoAssignTeamsToPots(body.tournamentId); }
}
