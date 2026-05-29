import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
export declare class MatchesService {
    private prisma;
    private scoring;
    constructor(prisma: PrismaService, scoring: ScoringService);
    findByTournament(tournamentId: string, phaseId?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(data: {
        tournamentId: string;
        phaseId: string;
        homeTeamId: string;
        awayTeamId: string;
        matchDate?: string;
        notes?: string;
    }): import(".prisma/client").Prisma.Prisma__MatchClient<{
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
    createBulk(tournamentId: string, phaseId: string, matchups: Array<{
        homeTeamId: string;
        awayTeamId: string;
        matchDate?: string;
    }>): Promise<({
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
    update(id: string, data: {
        matchDate?: string;
        notes?: string;
        status?: any;
    }): import(".prisma/client").Prisma.Prisma__MatchClient<{
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
    recordResult(matchId: string, data: {
        homeGoals: number;
        awayGoals: number;
        hadPenalties?: boolean;
        advancingTeamId?: string;
    }): Promise<{
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
    correctResult(matchId: string, data: {
        homeGoals: number;
        awayGoals: number;
        hadPenalties?: boolean;
        advancingTeamId?: string;
    }): Promise<{
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
