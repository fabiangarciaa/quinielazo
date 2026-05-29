import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Participants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private svc: ParticipantsService) {}

  @Get()
findAll(
  @Query('tournamentId') tid: string,
  @Query('userId') userId: string,
) {
  if (userId) return this.svc.findByUser(userId);
  return this.svc.findByTournament(tid);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/scores')
  scores(@Param('id') id: string) {
    return this.svc.getScoreHistory(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }

  @Post('generate-credentials/:tournamentId')
  generateCredentials(@Param('tournamentId') tid: string) {
    return this.svc.generateCredentials(tid);
  }
}