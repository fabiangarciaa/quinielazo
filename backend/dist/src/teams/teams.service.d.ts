import { PrismaService } from '../prisma/prisma.service';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTournament(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<({
        pot: {
            id: string;
            name: string;
            tournamentId: string;
            level: number;
            strengthMin: number;
            strengthMax: number;
            teamsPerParticipant: number;
        };
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
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__TeamClient<{
        scores: {
            id: string;
            eventType: string;
            earnedAt: Date;
            resultId: string;
            teamId: string;
            pointsEarned: number;
        }[];
        pot: {
            id: string;
            name: string;
            tournamentId: string;
            level: number;
            strengthMin: number;
            strengthMax: number;
            teamsPerParticipant: number;
        };
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
        homeMatches: ({
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
        })[];
        awayMatches: ({
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
        })[];
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: {
        tournamentId: string;
        name: string;
        country?: string;
        strength?: number;
        potId?: string;
    }): import(".prisma/client").Prisma.Prisma__TeamClient<{
        pot: {
            id: string;
            name: string;
            tournamentId: string;
            level: number;
            strengthMin: number;
            strengthMax: number;
            teamsPerParticipant: number;
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: {
        name?: string;
        country?: string;
        strength?: number;
        potId?: string;
        status?: any;
        phaseReached?: string;
    }): import(".prisma/client").Prisma.Prisma__TeamClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    assignToParticipant(teamId: string, participantId: string | null): Promise<{
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
    }>;
    delete(id: string): import(".prisma/client").Prisma.Prisma__TeamClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    importFromCsv(tournamentId: string, csvContent: string): Promise<{
        imported: number;
        teams: any[];
    }>;
}
