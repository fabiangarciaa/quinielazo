import { PrismaService } from '../prisma/prisma.service';
export declare class PotsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTournament(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(data: {
        tournamentId: string;
        name: string;
        level: number;
        strengthMin: number;
        strengthMax: number;
        teamsPerParticipant: number;
    }): import(".prisma/client").Prisma.Prisma__PotClient<{
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
    update(id: string, data: any): import(".prisma/client").Prisma.Prisma__PotClient<{
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
    autoAssignTeamsToPots(tournamentId: string): Promise<{
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
