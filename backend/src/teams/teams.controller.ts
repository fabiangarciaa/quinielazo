import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Teams') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('teams')
export class TeamsController {
  constructor(private svc: TeamsService) {}
  @Get() findAll(@Query('tournamentId') tid: string) { return this.svc.findByTournament(tid); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Patch(':id/assign') assign(@Param('id') id: string, @Body() body: {participantId: string|null}) {
    return this.svc.assignToParticipant(id, body.participantId);
  }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  import(@UploadedFile() file: Express.Multer.File, @Body() body: {tournamentId: string}) {
    return this.svc.importFromCsv(body.tournamentId, file.buffer.toString('utf8'));
  }
}
