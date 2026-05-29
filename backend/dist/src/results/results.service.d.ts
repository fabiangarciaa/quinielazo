import { PrismaService } from '../prisma/prisma.service';
export declare class ResultsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTournament(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<({
        match: {
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
        };
    } & {
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
    })[]>;
    getImpact(resultId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
        tournamentId: string;
        participantId: string;
        earnedAt: Date;
        resultId: string | null;
        scoringRuleId: string | null;
        teamId: string | null;
        pointsEarned: number;
        reason: string;
    })[]>;
}
