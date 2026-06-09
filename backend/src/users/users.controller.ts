import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Get(':id/tournaments')
  findUserTournaments(@Param('id') id: string) { return this.svc.findUserTournaments(id); }

  // Admin: editar usuario completo
  @Patch(':id/admin')
  adminUpdateUser(@Param('id') id: string, @Body() b: { name?: string; email?: string; username?: string }) {
    return this.svc.adminUpdateUser(id, b);
  }

  // Admin: resetear contraseña
  @Patch(':id/reset-password')
  adminResetPassword(@Param('id') id: string, @Body() b: { password: string }) {
    return this.svc.adminResetPassword(id, b.password);
  }

  // Admin: agregar a torneo
  @Post(':id/tournaments')
  addToTournament(@Param('id') id: string, @Body() b: { tournamentId: string; name: string }) {
    return this.svc.addToTournament(id, b.tournamentId, b.name);
  }

  // Admin: quitar de torneo
  @Delete('participants/:participantId')
  removeFromTournament(@Param('participantId') participantId: string) {
    return this.svc.removeFromTournament(participantId);
  }

  // Admin: asigna username
  @Patch(':id/username')
  assignUsername(@Param('id') id: string, @Body() b: { username: string }) {
    return this.svc.assignUsername(id, b.username);
  }

  // Participante: edita su perfil
  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() b: { name?: string; password?: string }) {
    return this.svc.updateProfile(id, b);
  }

  // Participante: edita su alias
  @Patch(':id/alias')
  updateAlias(@Param('id') id: string, @Body() b: { participantId: string; alias: string }) {
    return this.svc.updateAlias(b.participantId, b.alias);
  }
}