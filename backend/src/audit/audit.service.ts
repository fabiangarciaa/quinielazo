import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}
  log(userId: string|null, entityType: string, entityId: string, action: string, changes: any = {}) {
    return this.prisma.auditLog.create({ data:{ userId, entityType, entityId, action, changes } });
  }
  findAll(entityType?: string) {
    return this.prisma.auditLog.findMany({
      where:{ ...(entityType?{entityType}:{}) },
      include:{ user:{ select:{id:true,name:true,email:true} } },
      orderBy:{ createdAt:'desc' },
      take: 200,
    });
  }
}
