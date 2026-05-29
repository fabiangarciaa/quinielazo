import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  // Admin: asigna username a un usuario
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

  // Participante: edita su propio perfil (nombre y contraseña)
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

  // Participante: edita alias (se guarda en Participant, no en User)
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