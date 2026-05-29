import { DrawsService } from './draws.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class DrawsController {
    private svc;
    private prisma;
    constructor(svc: DrawsService, prisma: PrismaService);
    findAll(tid: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        status: string;
        tournamentId: string;
        method: import(".prisma/client").$Enums.DrawMethod;
        balanceScore: number | null;
        assignments: import("@prisma/client/runtime/library").JsonValue;
        executedAt: Date | null;
    }[]>;
    proposal(tid: string): Promise<{
        pots: Array<{
            level: number;
            name: string;
            strengthMin: number;
            strengthMax: number;
            teams: any[];
        }>;
        teamsPerParticipant: number;
    }>;
    pots(tid: string): Promise<import("./draws.service").DrawResult>;
    snake(tid: string): Promise<import("./draws.service").DrawResult>;
    balanced(tid: string, body: {
        teamsPerParticipant: number;
    }): Promise<import("./draws.service").DrawResult>;
}
