import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
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

  // Admin: asigna username a un usuario
  @Patch(':id/username')
  assignUsername(@Param('id') id: string, @Body() b: { username: string }) {
    return this.svc.assignUsername(id, b.username);
  }

  // Participante: edita su perfil (nombre y contraseña)
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