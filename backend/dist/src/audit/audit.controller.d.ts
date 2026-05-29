import { AuditService } from './audit.service';
export declare class AuditController {
    private svc;
    constructor(svc: AuditService);
    findAll(et?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
