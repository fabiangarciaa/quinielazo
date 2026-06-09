import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  async findUserTournaments(userId: string) {
    return this.prisma.participant.findMany({
      where: { userId },
      include: {
        tournament: {
          select: { id: true, name: true, status: true },
        },
      },
    });
  }

  async assignUsername(id: string, username: string) {
    const exists = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });
    if (exists && exists.id !== id) throw new ConflictException('El username ya está en uso');
    return this.prisma.user.update({
      where: { id },
      data: { username },
      select: { id: true, name: true, email: true, username: true, role: true },
    });
  }

  async adminUpdateUser(id: string, data: { name?: string; email?: string; username?: string }) {
    if (data.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: data.username },
        select: { id: true },
      });
      if (exists && exists.id !== id) throw new ConflictException('El username ya está en uso');
    }
    if (data.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });
      if (exists && exists.id !== id) throw new ConflictException('El email ya está en uso');
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, username: true, role: true },
    });
  }

  async adminResetPassword(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, name: true, username: true },
    });
  }

  async addToTournament(userId: string, tournamentId: string, name: string) {
    // Verificar que no esté ya inscrito
    const existing = await this.prisma.participant.findFirst({
      where: { userId, tournamentId },
    });
    if (existing) throw new ConflictException('El usuario ya está inscrito en este torneo');

    return this.prisma.participant.create({
      data: { userId, tournamentId, name },
      include: { tournament: { select: { id: true, name: true, status: true } } },
    });
  }

  async removeFromTournament(participantId: string) {
    // Verificar que el torneo no esté en progreso
    const participant = await this.prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { tournament: true },
    });

    const blockedStatuses = ['IN_PROGRESS', 'FINISHED'];
    if (blockedStatuses.includes(participant.tournament.status)) {
      throw new ConflictException('No se puede eliminar un participante de un torneo en progreso');
    }

    return this.prisma.participant.delete({ where: { id: participantId } });
  }

  async updateProfile(id: string, data: { name?: string; password?: string }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, username: true, role: true },
    });
  }

  async updateAlias(participantId: string, alias: string) {
    return this.prisma.participant.update({
      where: { id: participantId },
      data: { alias },
    });
  }

  update(id: string, data: { name?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }
}