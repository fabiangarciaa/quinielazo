import { PotsService } from './pots.service';
export declare class PotsController {
    private svc;
    constructor(svc: PotsService);
    findAll(tid: string): import(".prisma/client").Prisma.PrismaPromise<({
        teams: ({
            participant: {
                id: string;
                name: string;
                alias: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TeamStatus;
            draws: number;
            tournamentId: string;
            country: string | null;
            shieldUrl: string | null;
            strength: number;
            matchesPlayed: number;
            wins: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheets: number;
            thrashings: number;
            phaseReached: string | null;
            participantId: string | null;
            potId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        tournamentId: string;
        level: number;
        strengthMin: number;
        strengthMax: number;
        teamsPerParticipant: number;
    })[]>;
    create(body: any): import(".prisma/client").Prisma.Prisma__PotClient<{
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TeamStatus;
            draws: number;
            tournamentId: string;
            country: string | null;
            shieldUrl: string | null;
            strength: number;
            matchesPlayed: number;
            wins: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheets: number;
            thrashings: number;
            phaseReached: string | null;
            participantId: string | null;
            potId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        tournamentId: string;
        level: number;
        strengthMin: number;
        strengthMax: number;
        teamsPerParticipant: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, body: any): import(".prisma/client").Prisma.Prisma__PotClient<{
        id: string;
        name: string;
        tournamentId: string;
        level: number;
        strengthMin: number;
        strengthMax: number;
        teamsPerParticipant: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    delete(id: string): import(".prisma/client").Prisma.Prisma__PotClient<{
        id: string;
        name: string;
        tournamentId: string;
        level: number;
        strengthMin: number;
        strengthMax: number;
        teamsPerParticipant: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    autoAssign(body: {
        tournamentId: string;
    }): Promise<{
        message: string;
        potsCreated?: undefined;
        teamsAssigned?: undefined;
        teamsPerPot?: undefined;
        numPots?: undefined;
    } | {
        message: string;
        potsCreated: number;
        teamsAssigned: number;
        teamsPerPot: number;
        numPots: number;
    }>;
}
