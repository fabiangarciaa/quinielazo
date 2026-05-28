import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  findByTournament(tournamentId: string) {
    return this.prisma.participant.findMany({
      where: { tournamentId },
      include: {
        teams: { orderBy: { strength: 'desc' } },
        scores: { orderBy: { earnedAt: 'desc' }, take: 10 },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { scores: true } },
      },
      orderBy: { currentRank: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.participant.findUniqueOrThrow({
      where: { id },
      include: {
        teams: true,
        scores: { orderBy: { earnedAt: 'desc' }, take: 50 },
        rankingHistory: { orderBy: { snapshotAt: 'asc' } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(data: {
    tournamentId: string;
    name: string;
    alias?: string;
    userId?: string;
    // Datos opcionales para crear usuario automáticamente
    createUser?: boolean;
    email?: string;
    password?: string;
  }) {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: data.tournamentId },
    });
    const count = await this.prisma.participant.count({
      where: { tournamentId: data.tournamentId },
    });
    if (count >= tournament.participantCount) {
      throw new BadRequestException(
        `El torneo ya tiene el máximo de ${tournament.participantCount} participantes`,
      );
    }

    let userId = data.userId;

    // Crear usuario automáticamente si se pidió
    if (data.createUser && data.email && data.password) {
      const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (exists) {
        // Si ya existe el usuario, solo vincular
        userId = exists.id;
      } else {
        const hash = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
          data: {
            name: data.alias || data.name,
            email: data.email,
            passwordHash: hash,
            role: 'USER',
          },
        });
        userId = user.id;
      }
    }

    return this.prisma.participant.create({
      data: {
        tournamentId: data.tournamentId,
        name: data.name,
        alias: data.alias,
        userId,
      },
      include: { teams: true, user: { select: { id: true, name: true, email: true } } },
    });
  }

  update(id: string, data: { name?: string; alias?: string }) {
    return this.prisma.participant.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.team.updateMany({ where: { participantId: id }, data: { participantId: null } });
    return this.prisma.participant.delete({ where: { id } });
  }

  getScoreHistory(participantId: string) {
    return this.prisma.participantScore.findMany({
      where: { participantId },
      include: {
        result: {
          include: {
            match: {
              include: { homeTeam: true, awayTeam: true, phase: true },
            },
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  // Generar credenciales para todos los participantes de un torneo
  async generateCredentials(tournamentId: string) {
    const participants = await this.prisma.participant.findMany({
      where: { tournamentId },
      include: { user: true },
    });

    const results = [];

    for (const p of participants) {
      if (p.user) {
        results.push({
          participantId: p.id,
          name: p.alias || p.name,
          email: p.user.email,
          alreadyHadUser: true,
          password: null,
        });
        continue;
      }

      // Generar email y contraseña automáticos
      const baseName = (p.alias || p.name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');
      const email = `${baseName}@quinielazo.mx`;
      const password = Math.random().toString(36).slice(-8); // 8 chars aleatorios

      // Verificar que el email no exista
      const exists = await this.prisma.user.findUnique({ where: { email } });
      const finalEmail = exists ? `${baseName}.${p.id.slice(0, 4)}@quinielazo.mx` : email;

      const hash = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: { name: p.alias || p.name, email: finalEmail, passwordHash: hash, role: 'USER' },
      });

      await this.prisma.participant.update({ where: { id: p.id }, data: { userId: user.id } });

      results.push({
        participantId: p.id,
        name: p.alias || p.name,
        email: finalEmail,
        password,
        alreadyHadUser: false,
      });
    }

    return results;
  }
}