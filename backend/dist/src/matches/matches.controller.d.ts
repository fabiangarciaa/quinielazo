import { MatchesService } from './matches.service';
export declare class MatchesController {
    private svc;
    constructor(svc: MatchesService);
    findAll(tid: string, pid?: string): import(".prisma/client").Prisma.PrismaPromise<({
        result: {
            id: string;
            matchId: string;
            homeGoals: number;
            awayGoals: number;
            winnerTeamId: string | null;
            hadPenalties: boolean;
            homeCleanSheet: boolean;
            awayCleanSheet: boolean;
            isThrashing: boolean;
            advancingTeamId: string | null;
            recordedAt: Date;
            recordedBy: string | null;
        };
        phase: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.PhaseType;
            isActive: boolean;
            tournamentId: string;
            roundNumber: number;
            startDate: Date | null;
            endDate: Date | null;
        };
        homeTeam: {
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
        };
        awayTeam: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__MatchClient<{
        result: {
            id: string;
            matchId: string;
            homeGoals: number;
            awayGoals: number;
            winnerTeamId: string | null;
            hadPenalties: boolean;
            homeCleanSheet: boolean;
            awayCleanSheet: boolean;
            isThrashing: boolean;
            advancingTeamId: string | null;
            recordedAt: Date;
            recordedBy: string | null;
        };
        phase: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.PhaseType;
            isActive: boolean;
            tournamentId: string;
            roundNumber: number;
            startDate: Date | null;
            endDate: Date | null;
        };
        homeTeam: {
            participant: {
                id: string;
                name: string;
                avatarUrl: string | null;
                tournamentId: string;
                userId: string | null;
                alias: string | null;
                totalPoints: number;
                currentRank: number;
                prevRank: number;
                joinedAt: Date;
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
        };
        awayTeam: {
            participant: {
                id: string;
                name: string;
                avatarUrl: string | null;
                tournamentId: string;
                userId: string | null;
                alias: string | null;
                totalPoints: number;
                currentRank: number;
                prevRank: number;
                joinedAt: Date;
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(body: any): import(".prisma/client").Prisma.Prisma__MatchClient<{
        phase: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.PhaseType;
            isActive: boolean;
            tournamentId: string;
            roundNumber: number;
            startDate: Date | null;
            endDate: Date | null;
        };
        homeTeam: {
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
        };
        awayTeam: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    createBulk(body: {
        tournamentId: string;
        phaseId: string;
        matchups: any[];
    }): Promise<({
        result: {
            id: string;
            matchId: string;
            homeGoals: number;
            awayGoals: number;
            winnerTeamId: string | null;
            hadPenalties: boolean;
            homeCleanSheet: boolean;
            awayCleanSheet: boolean;
            isThrashing: boolean;
            advancingTeamId: string | null;
            recordedAt: Date;
            recordedBy: string | null;
        };
        phase: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.PhaseType;
            isActive: boolean;
            tournamentId: string;
            roundNumber: number;
            startDate: Date | null;
            endDate: Date | null;
        };
        homeTeam: {
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
        };
        awayTeam: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    })[]>;
    update(id: string, body: any): import(".prisma/client").Prisma.Prisma__MatchClient<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    delete(id: string): import(".prisma/client").Prisma.Prisma__MatchClient<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MatchStatus;
        tournamentId: string;
        matchDate: Date | null;
        notes: string | null;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    recordResult(id: string, body: any): Promise<{
        result: any;
        pointsGenerated: Array<{
            participantId: string;
            points: number;
            reason: string;
        }>;
        rankingBefore: any[];
        rankingAfter: any[];
        summary: string;
    }>;
    correctResult(id: string, body: any): Promise<{
        result: any;
        pointsGenerated: Array<{
            participantId: string;
            points: number;
            reason: string;
        }>;
        rankingBefore: any[];
        rankingAfter: any[];
        summary: string;
    }>;
}
