import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(userId: string | null, entityType: string, entityId: string, action: string, changes?: any): import(".prisma/client").Prisma.Prisma__AuditLogClient<{
        id: string;
        createdAt: Date;
        userId: string | null;
        entityType: string;
        entityId: string;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(entityType?: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        entityType: string;
        entityId: string;
        action: string;
        changes: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
}
